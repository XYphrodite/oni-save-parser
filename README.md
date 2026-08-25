# @reborn/oni-save-parser

> Fork of [RoboPhred/oni-save-parser](https://github.com/RoboPhred/oni-save-parser) (MIT), whose last release was September 2023.
> Changes are listed in [CHANGELOG.md](CHANGELOG.md) under 15.0.0. Target is the **base game with no DLC**.

This library parses and writes save data from [Oxygen Not Included](https://www.klei.com/games/oxygen-not-included). It is intended for both nodejs and web environments (through webpack or rollup).

This is a utility library for editing saves. If you are looking for a way to edit your save files, you can do so using [Duplicity](https://github.com/RoboPhred/oni-duplicity).

## Game Compatibility

Save files are self-describing: each one carries the type templates for everything
it contains, and behavior data this parser has no dedicated reader for is preserved
verbatim as `extraRaw`. A new game version therefore usually parses and re-serializes
correctly without any code change.

Because of that, version checking defaults to `major` strictness -- any save with major
version 7 is accepted. `VERIFIED_VERSION_MINORS` lists the minor versions actually
round-trip verified against this parser; `minor` strictness restricts loading to those.

To verify a version, run the round-trip check against a real save:

```
npm run build
npm run check -- "path/to/colony.sav"
```

It parses the save, writes it back, re-parses the result and diffs the two models.
A clean run means the version round-trips losslessly -- add its minor number to
`VERIFIED_VERSION_MINORS`. The check also lists behaviors carrying extra data this
parser does not model, which is where a future format change would show up first.

Note that the written file is never byte-identical to the original: the game compresses
with Ionic.Zlib and this library uses pako. Only the uncompressed content matches.

## JSON output

Two CLIs, both writing JSON to stdout or to `--out`:

```
npm run dump -- "colony.sav"                     # digest, the default
npm run dump -- "colony.sav" --out colony.json
npm run dump -- "colony.sav" --scope full        # raw parsed model
```

The **digest** is built to be read rather than to be complete. A save holds
hundreds of thousands of game objects, so dumping them verbatim produces
megabytes that say very little. It resolves hashes back to names, aggregates the
long tail into counts, and keeps per-entity detail only where entities are few
and individually meaningful:

| Section | Contents |
| --- | --- |
| `meta` | build, save version, whether the version is verified, DLC ids |
| `colony` | name, cycle count, duplicant count, sandbox flag |
| `world` | map dimensions, whether the surface is discovered |
| `difficulty` | custom game settings, per-setting quality levels |
| `duplicants` | name, traits, role, mastered skills, attribute levels, live meters (stress, calories, stamina...), sicknesses, health |
| `geysers` | type, cell, configuration rolls |
| `research` | techs completed, pending list, unspent points |
| `power` | stored joules, battery / generator / consumer counts |
| `buildings` | totals, how many switched off by hand, how many damaged |
| `plants` | total and how many are ready to harvest |
| `objects` | totals plus a count per prefab |
| `materials` | per element: mass and mass-weighted mean temperature |
| `achievements` | colony achievements earned, failed and still pending |
| `unmodelledBehaviors` | behaviors carrying data this parser does not model |

Digest size tracks the number of *distinct* prefabs, duplicants and geysers, not
the number of objects, so it stays small as a colony grows. On a toy 560-object
save the digest is 2.4 KB where the full dump is 143 KB.

`--top N` folds prefab and element counts past the Nth entry into one
`"(N more)"` bucket. `--scope full` emits the whole parsed model instead, with
binary values as `{ "": "<base64>", "length": n }`; `simData` is omitted
unless `--include-sim` is passed, being megabytes this parser never interprets.

Both are also available as library functions, for calling from a service rather
than a shell:

```ts
import { parseSaveGame, buildSaveDigest } from "/oni-save-parser";

const digest = buildSaveDigest(parseSaveGame(bytes));
```

## API

- `parseOniSave(ArrayBuffer): SaveGame`
  Parses an ArrayBuffer of data into a save game object.

- `writeOniSave(SaveGame): ArrayBuffer`
  Writes a save game object into an array buffer.

### Typedefs

Typescript typedefs are included in this package, ready for use by typescript or any IDE that supports them.

## Design Philosophy

### Idempotent load-save cycle

This library intends to provide an idempotent load/save cycle: A save file that is loaded then written should generate a new file with identical content to the original. While the resulting file may differ due to implementation differences in the zlib compression library, the uncompressed content should be identical.

Due to this, the api uses arrays of key-value tuples rather than objects or Maps. This is required to guarantee the ordering of the elements remains the same.

The intent is to ensure as little data changes in the save as possible, to guard against potential cases where the ONI code makes assumptions or contains bugs regarding the ordering of data in data structures that might otherwise seem unordered.

A practical upshot of this is that the guaranteed order allows us to efficiently test the parser by round-trip loading and saving a file. By recording each parse instruction used when loading a file, we can ensure we receive the same write-equivalent instructions on saving. Any differences detected indicates that either the load or save operation is treating data differently than its counterpart, indicating a logic error. This check is made possible by the trampoline parser. See below for more information.

### Instruction-based 'trampoline' parser

Parsing and unparsing is done through functions that generate and yield instructions to a top level parser. This buys us several advantages:

- Ability to pause / delay / cancel / 'coroutine' the parse operation for environments that do not have threads.
- Ability to replace the parser with a test implementation to ensure the expected operations are being performed.
- Ability to inspect the parse progress, for use with progress reporting.
- Ability to include extranious information such as the current parse target, for use with progress reporting and error handling.

## Example usage

```
const { readFileSync } = require("fs");
const {
    parseSaveGame,
    writeSaveGame,
    AIAttributeLevelsBehavior
} = require("oni-save-parser");

function loadFile(fileName) {
  const fileData = readFileSync(`./test-data/${fileName}.sav`);
  return parseSaveGame(fileData.buffer);
}

function saveFile(fileName, save) {
  const fileData = writeSaveGame(save);
  writeFileSync(`./test-data/${fileName}.sav`, new Uint8Array(fileData));
}

const saveData = loadFile(fileName);

// Make all duplicants half-sized
const minions = saveData.gameObjects.find(x => x.name === "Minion")!;
for (const minion of minions.gameObjects) {
  minion.scale.x = 0.5;
  minion.scale.y = 0.5;
}

// Modify attributes of all duplicants
for (const minion of minions.gameObjects) {
  const skillBehavior = getBehavior(minion, AIAttributeLevelsBehavior);
  // Set each attribute to 10
  for (const attribute of skillBehavior.templateData.saveLoadLevels) {
    attribute.level = 10
  }
}

saveFile(`${fileName}-tweaked`, saveData);
```

## Current Progress

Data can be loaded by `parseOniSave(source: ArrayBuffer)`, and the data written out using `writeOniSave(save: OniSave): ArrayBuffer`.
Brand new saves cannot be created, as the world data format is not understood. This data is preserved as-is when a save is parsed then re-written.

The save file and all templated data objects are loaded.
This includes most of the interesting stuff, like duplicant stats, building attributes, and so on.
Some information is still not parsed, such as the general world map and some specific data for a few of
the more esoteric game objects.
