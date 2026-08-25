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

import { readFileSync, writeFileSync } from "fs";

import minimist from "minimist";
import { diff } from "deep-diff";

import { parseSaveGame, writeSaveGame, ParseError } from "../index";
import {
  SaveGame,
  GameObjectGroup,
  isBaseGameSave,
  getDLCIds,
  isVerifiedVersion,
  VersionStrictness,
} from "../save-structure";

const args = minimist(process.argv.slice(2), {
  string: ["strictness", "write-back"],
  boolean: ["json"],
  default: { strictness: "major" },
});

const filePath: string | undefined = args._[0];
if (!filePath) {
  console.error(
    "Usage: npm run check -- <path-to.sav> [--strictness major|minor|none] [--write-back <path>] [--json]"
  );
  process.exit(2);
}

const strictness = args.strictness as VersionStrictness;
if (["none", "major", "minor"].indexOf(strictness) === -1) {
  console.error(`Unknown strictness "${strictness}".`);
  process.exit(2);
}

const problems: string[] = [];

function fail(message: string, err?: unknown): never {
  if (err instanceof ParseError || (err as any)?.position != null) {
    console.error(`${message}: ${(err as Error).message}`);
    console.error(`  at byte offset ${(err as any).position}`);
  } else if (err) {
    console.error(`${message}: ${(err as Error).message ?? String(err)}`);
  } else {
    console.error(message);
  }
  return process.exit(1);
}

function toArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
}

const original = toArrayBuffer(filePath);

let save: SaveGame;
try {
  save = parseSaveGame(original, { versionStrictness: strictness });
} catch (e) {
  fail("Parse failed", e);
}

const info = save.header.gameInfo;
const version = `${info.saveMajorVersion}.${info.saveMinorVersion}`;
const dlcIds = getDLCIds(info);
const verified = isVerifiedVersion(
  info.saveMajorVersion,
  info.saveMinorVersion
);

let written: ArrayBuffer;
try {
  written = writeSaveGame(save);
} catch (e) {
  fail("Write failed", e);
}

if (args["write-back"]) {
  writeFileSync(args["write-back"], Buffer.from(written));
}

let reparsed: SaveGame;
try {
  reparsed = parseSaveGame(written, { versionStrictness: "none" });
} catch (e) {
  fail("Re-parse of written save failed", e);
}

// simData is an opaque blob this parser never interprets; deep-diff would walk
// megabytes of numbers to tell us nothing. Compare it directly instead.
if (!buffersEqual(save.simData, reparsed.simData)) {
  problems.push("simData changed across the write/re-parse cycle");
}

const changes =
  diff(stripSimData(save), stripSimData(reparsed), (_path, key) =>
    // Unknown extra-data is kept as raw bytes; compared separately below.
    key === "extraRaw"
  ) ?? [];
if (changes.length > 0) {
  problems.push(`${changes.length} field(s) differ after re-parse`);
}

const rawMismatches = compareExtraRaw(save, reparsed);
if (rawMismatches > 0) {
  problems.push(`${rawMismatches} behavior(s) with mismatched raw extra data`);
}

const unknownExtraData = collectUnknownExtraData(save);

if (args.json) {
  console.log(
    JSON.stringify(
      {
        file: filePath,
        buildVersion: save.header.buildVersion,
        saveVersion: version,
        verified,
        baseGame: isBaseGameSave(info),
        dlcIds,
        cycles: info.numberOfCycles,
        duplicants: info.numberOfDuplicants,
        gameObjectGroups: save.gameObjects.length,
        unknownExtraData,
        problems,
        ok: problems.length === 0,
      },
      null,
      2
    )
  );
} else {
  console.log(`File            ${filePath}`);
  console.log(`Build           ${save.header.buildVersion}`);
  console.log(
    `Save version    ${version}${
      verified ? " (verified)" : " (NOT yet verified)"
    }`
  );
  console.log(
    `Content         ${
      isBaseGameSave(info) ? "base game, no DLC" : dlcIds.join(", ")
    }`
  );
  console.log(`Colony          ${info.baseName}`);
  console.log(
    `Scale           ${info.numberOfCycles} cycles, ${info.numberOfDuplicants} duplicants, ${save.gameObjects.length} object groups`
  );
  console.log(
    `Compression     ${save.header.isCompressed ? "zlib" : "none"} (${
      original.byteLength
    } bytes in, ${written.byteLength} bytes out)`
  );

  if (unknownExtraData.length > 0) {
    console.log(
      `\nBehaviors with unparsed extra data (preserved verbatim, ${unknownExtraData.length}):`
    );
    for (const { name, count, bytes } of unknownExtraData) {
      console.log(`  ${name}  x${count}  ${bytes} bytes`);
    }
  }

  if (problems.length === 0) {
    console.log(`\nOK: round-trip is lossless.`);
    if (!verified) {
      console.log(
        `Add ${info.saveMinorVersion} to VERIFIED_VERSION_MINORS to accept this version under "minor" strictness.`
      );
    }
  } else {
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

function stripSimData(save: SaveGame): Omit<SaveGame, "simData"> {
  const { simData, ...rest } = save;
  return rest;
}

function buffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  return Buffer.from(a).equals(Buffer.from(b));
}

function eachBehavior(
  groups: GameObjectGroup[],
  visit: (
    groupIndex: number,
    objectIndex: number,
    behaviorIndex: number
  ) => void
) {
  groups.forEach((group, groupIndex) =>
    group.gameObjects.forEach((gameObject, objectIndex) =>
      gameObject.behaviors.forEach((_behavior, behaviorIndex) =>
        visit(groupIndex, objectIndex, behaviorIndex)
      )
    )
  );
}

function compareExtraRaw(a: SaveGame, b: SaveGame): number {
  let mismatches = 0;
  eachBehavior(a.gameObjects, (g, o, i) => {
    const left = a.gameObjects[g].gameObjects[o].behaviors[i];
    const right = b.gameObjects[g]?.gameObjects[o]?.behaviors[i];
    if (!right || left.name !== right.name) {
      mismatches++;
      return;
    }
    if (!left.extraRaw && !right.extraRaw) {
      return;
    }
    if (
      !left.extraRaw ||
      !right.extraRaw ||
      !buffersEqual(left.extraRaw, right.extraRaw)
    ) {
      mismatches++;
    }
  });
  return mismatches;
}

interface UnknownExtraData {
  name: string;
  count: number;
  bytes: number;
}

function collectUnknownExtraData(save: SaveGame): UnknownExtraData[] {
  const byName = new Map<string, UnknownExtraData>();
  eachBehavior(save.gameObjects, (g, o, i) => {
    const behavior = save.gameObjects[g].gameObjects[o].behaviors[i];
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
