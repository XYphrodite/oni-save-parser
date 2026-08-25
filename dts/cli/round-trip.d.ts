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
export {};
