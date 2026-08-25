/**
 * Dump a save file to JSON.
 *
 * Usage: npm run dump -- <path-to.sav> [--out out.json] [--scope digest|full]
 *                        [--top N] [--compact] [--include-sim]
 *
 * The default "digest" scope is built to be read rather than to be complete;
 * see src/digest/digest.ts. Use "full" for the raw parsed model instead.
 */

import { readFileSync, writeFileSync } from "fs";

import minimist from "minimist";

import { parseSaveGame } from "../index";
import { SaveGame, VersionStrictness } from "../save-structure";
import { buildSaveDigest, buildFullDump } from "../digest";

const args = minimist(process.argv.slice(2), {
  string: ["out", "scope", "strictness"],
  boolean: ["compact", "include-sim"],
  default: { scope: "digest", strictness: "major", top: 0 },
});

const filePath: string | undefined = args._[0];
if (!filePath) {
  console.error(
    "Usage: npm run dump -- <path-to.sav> [--out out.json] [--scope digest|full] [--top N] [--compact] [--include-sim]"
  );
  process.exit(2);
}

const scope = args.scope as "digest" | "full";
if (scope !== "digest" && scope !== "full") {
  console.error(`Unknown scope "${scope}". Expected "digest" or "full".`);
  process.exit(2);
}

const buf = readFileSync(filePath);
const data = buf.buffer.slice(
  buf.byteOffset,
  buf.byteOffset + buf.byteLength
) as ArrayBuffer;

let save: SaveGame;
try {
  save = parseSaveGame(data, {
    versionStrictness: args.strictness as VersionStrictness,
  });
} catch (e) {
  const position = (e as any)?.position;
  console.error(
    `Parse failed: ${e instanceof Error ? e.message : String(e)}${
      position != null ? ` (at byte offset ${position})` : ""
    }`
  );
  process.exit(1);
}

const output =
  scope === "digest"
    ? buildSaveDigest(save, {
        file: filePath,
        bytes: data.byteLength,
        top: Number(args.top) || 0,
      })
    : buildFullDump(save, { includeSim: Boolean(args["include-sim"]) });

const json = JSON.stringify(output, null, args.compact ? 0 : 2);

if (args.out) {
  writeFileSync(args.out, json, "utf8");
  console.error(`Wrote ${args.out} (${json.length} bytes).`);
} else {
  console.log(json);
}
