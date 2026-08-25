"use strict";
/**
 * Dump a save file to JSON.
 *
 * Usage: npm run dump -- <path-to.sav> [--out out.json] [--scope digest|full]
 *                        [--top N] [--compact] [--include-sim]
 *
 * The default "digest" scope is built to be read rather than to be complete;
 * see src/digest/digest.ts. Use "full" for the raw parsed model instead.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const minimist_1 = __importDefault(require("minimist"));
const index_1 = require("../index");
const digest_1 = require("../digest");
const args = (0, minimist_1.default)(process.argv.slice(2), {
    string: ["out", "scope", "strictness"],
    boolean: ["compact", "include-sim"],
    default: { scope: "digest", strictness: "major", top: 0 },
});
const filePath = args._[0];
if (!filePath) {
    console.error("Usage: npm run dump -- <path-to.sav> [--out out.json] [--scope digest|full] [--top N] [--compact] [--include-sim]");
    process.exit(2);
}
const scope = args.scope;
if (scope !== "digest" && scope !== "full") {
    console.error(`Unknown scope "${scope}". Expected "digest" or "full".`);
    process.exit(2);
}
const buf = (0, fs_1.readFileSync)(filePath);
const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
let save;
try {
    save = (0, index_1.parseSaveGame)(data, {
        versionStrictness: args.strictness,
    });
}
catch (e) {
    const position = e?.position;
    console.error(`Parse failed: ${e instanceof Error ? e.message : String(e)}${position != null ? ` (at byte offset ${position})` : ""}`);
    process.exit(1);
}
const output = scope === "digest"
    ? (0, digest_1.buildSaveDigest)(save, {
        file: filePath,
        bytes: data.byteLength,
        top: Number(args.top) || 0,
    })
    : (0, digest_1.buildFullDump)(save, { includeSim: Boolean(args["include-sim"]) });
const json = JSON.stringify(output, null, args.compact ? 0 : 2);
if (args.out) {
    (0, fs_1.writeFileSync)(args.out, json, "utf8");
    console.error(`Wrote ${args.out} (${json.length} bytes).`);
}
else {
    console.log(json);
}
//# sourceMappingURL=dump.js.map