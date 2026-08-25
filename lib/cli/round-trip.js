"use strict";
/**
 * Round-trip verification for a real save file.
 *
 * Usage: npm run check -- <path-to.sav> [--strictness major|minor|none] [--json]
 *
 * The save body is zlib-compressed and the game uses Ionic.Zlib, so a re-written
 * file is never byte-identical to the original. The meaningful check is that the
 * parsed model survives a write/re-parse cycle unchanged:
 *
 *     parse(original) -> write -> parse again -> deep-diff must be empty
 *
 * An empty diff means this parser round-trips that save version safely.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const minimist_1 = __importDefault(require("minimist"));
const deep_diff_1 = require("deep-diff");
const index_1 = require("../index");
const save_structure_1 = require("../save-structure");
const args = (0, minimist_1.default)(process.argv.slice(2), {
    string: ["strictness", "write-back"],
    boolean: ["json"],
    default: { strictness: "major" },
});
const filePath = args._[0];
if (!filePath) {
    console.error("Usage: npm run check -- <path-to.sav> [--strictness major|minor|none] [--write-back <path>] [--json]");
    process.exit(2);
}
const strictness = args.strictness;
if (["none", "major", "minor"].indexOf(strictness) === -1) {
    console.error(`Unknown strictness "${strictness}".`);
    process.exit(2);
}
const problems = [];
function fail(message, err) {
    if (err instanceof index_1.ParseError || err?.position != null) {
        console.error(`${message}: ${err.message}`);
        console.error(`  at byte offset ${err.position}`);
    }
    else if (err) {
        console.error(`${message}: ${err.message ?? String(err)}`);
    }
    else {
        console.error(message);
    }
    return process.exit(1);
}
function toArrayBuffer(path) {
    const buf = (0, fs_1.readFileSync)(path);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
const original = toArrayBuffer(filePath);
let save;
try {
    save = (0, index_1.parseSaveGame)(original, { versionStrictness: strictness });
}
catch (e) {
    fail("Parse failed", e);
}
const info = save.header.gameInfo;
const version = `${info.saveMajorVersion}.${info.saveMinorVersion}`;
const dlcIds = (0, save_structure_1.getDLCIds)(info);
const verified = (0, save_structure_1.isVerifiedVersion)(info.saveMajorVersion, info.saveMinorVersion);
let written;
try {
    written = (0, index_1.writeSaveGame)(save);
}
catch (e) {
    fail("Write failed", e);
}
if (args["write-back"]) {
    (0, fs_1.writeFileSync)(args["write-back"], Buffer.from(written));
}
let reparsed;
try {
    reparsed = (0, index_1.parseSaveGame)(written, { versionStrictness: "none" });
}
catch (e) {
    fail("Re-parse of written save failed", e);
}
// simData is an opaque blob this parser never interprets; deep-diff would walk
// megabytes of numbers to tell us nothing. Compare it directly instead.
if (!buffersEqual(save.simData, reparsed.simData)) {
    problems.push("simData changed across the write/re-parse cycle");
}
const changes = (0, deep_diff_1.diff)(stripSimData(save), stripSimData(reparsed), (_path, key) => 
// Unknown extra-data is kept as raw bytes; compared separately below.
key === "extraRaw") ?? [];
if (changes.length > 0) {
    problems.push(`${changes.length} field(s) differ after re-parse`);
}
const rawMismatches = compareExtraRaw(save, reparsed);
if (rawMismatches > 0) {
    problems.push(`${rawMismatches} behavior(s) with mismatched raw extra data`);
}
const unknownExtraData = collectUnknownExtraData(save);
if (args.json) {
    console.log(JSON.stringify({
        file: filePath,
        buildVersion: save.header.buildVersion,
        saveVersion: version,
        verified,
        baseGame: (0, save_structure_1.isBaseGameSave)(info),
        dlcIds,
        cycles: info.numberOfCycles,
        duplicants: info.numberOfDuplicants,
        gameObjectGroups: save.gameObjects.length,
        unknownExtraData,
        problems,
        ok: problems.length === 0,
    }, null, 2));
}
else {
    console.log(`File            ${filePath}`);
    console.log(`Build           ${save.header.buildVersion}`);
    console.log(`Save version    ${version}${verified ? " (verified)" : " (NOT yet verified)"}`);
    console.log(`Content         ${(0, save_structure_1.isBaseGameSave)(info) ? "base game, no DLC" : dlcIds.join(", ")}`);
    console.log(`Colony          ${info.baseName}`);
    console.log(`Scale           ${info.numberOfCycles} cycles, ${info.numberOfDuplicants} duplicants, ${save.gameObjects.length} object groups`);
    console.log(`Compression     ${save.header.isCompressed ? "zlib" : "none"} (${original.byteLength} bytes in, ${written.byteLength} bytes out)`);
    if (unknownExtraData.length > 0) {
        console.log(`\nBehaviors with unparsed extra data (preserved verbatim, ${unknownExtraData.length}):`);
        for (const { name, count, bytes } of unknownExtraData) {
            console.log(`  ${name}  x${count}  ${bytes} bytes`);
        }
    }
    if (problems.length === 0) {
        console.log(`\nOK: round-trip is lossless.`);
        if (!verified) {
            console.log(`Add ${info.saveMinorVersion} to VERIFIED_VERSION_MINORS to accept this version under "minor" strictness.`);
        }
    }
    else {
        console.log(`\nFAILED:`);
        for (const problem of problems) {
            console.log(`  - ${problem}`);
        }
        for (const change of changes.slice(0, 20)) {
            console.log(`  ${change.kind} at ${(change.path ?? []).join(".")}`);
        }
        if (changes.length > 20) {
            console.log(`  ... and ${changes.length - 20} more`);
        }
    }
}
process.exit(problems.length === 0 ? 0 : 1);
function stripSimData(save) {
    const { simData, ...rest } = save;
    return rest;
}
function buffersEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    return Buffer.from(a).equals(Buffer.from(b));
}
/**
 * Walk every behavior in the save, including those on items inside containers.
 *
 * Stored items are game objects in their own right and carry their own
 * behaviors, so a walk that stops at the top level silently skips them.
 */
function eachBehavior(groups, visit) {
    const walk = (gameObject) => {
        for (const behavior of gameObject.behaviors) {
            visit(behavior, gameObject);
        }
        const storage = (0, save_structure_1.getBehavior)(gameObject, save_structure_1.StorageBehavior);
        for (const item of storage?.extraData ?? []) {
            walk(item);
        }
    };
    for (const group of groups) {
        for (const gameObject of group.gameObjects) {
            walk(gameObject);
        }
    }
}
/**
 * Compare raw extra data between the two parses.
 *
 * These bytes are excluded from the deep-diff (they are ArrayBuffers, which it
 * cannot compare usefully), so without this they would go unchecked entirely.
 */
function compareExtraRaw(a, b) {
    const left = [];
    const right = [];
    eachBehavior(a.gameObjects, (behavior) => left.push(behavior.extraRaw));
    eachBehavior(b.gameObjects, (behavior) => right.push(behavior.extraRaw));
    if (left.length !== right.length) {
        // A behavior appeared or vanished; report every slot as suspect rather
        // than comparing misaligned pairs.
        return Math.max(left.length, right.length);
    }
    let mismatches = 0;
    for (let i = 0; i < left.length; i++) {
        if (!left[i] && !right[i]) {
            continue;
        }
        if (!left[i] || !right[i] || !buffersEqual(left[i], right[i])) {
            mismatches++;
        }
    }
    return mismatches;
}
function collectUnknownExtraData(save) {
    const byName = new Map();
    eachBehavior(save.gameObjects, (behavior) => {
        if (!behavior.extraRaw) {
            return;
        }
        const entry = byName.get(behavior.name) ?? {
            name: behavior.name,
            count: 0,
            bytes: 0,
        };
        entry.count++;
        entry.bytes += behavior.extraRaw.byteLength;
        byName.set(behavior.name, entry);
    });
    return Array.from(byName.values()).sort((a, b) => b.bytes - a.bytes);
}
//# sourceMappingURL=round-trip.js.map