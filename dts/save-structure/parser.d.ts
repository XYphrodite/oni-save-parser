import { ParseIterator, UnparseIterator } from "../parser";
import { SaveGame } from "./save-game";
import { VersionStrictness } from "./version-validator";
export interface SaveGameParserOptions {
    /**
     * How strict the parser should be in ensuring the correct save file version is used.
     * - "major": Require the major version to match, allow any minor version. Default.
     *   Safe in practice: the save file carries its own type templates, and unknown
     *   behavior extra-data is preserved verbatim.
     * - "minor": Additionally require the minor version to be one this parser has been
     *   round-trip verified against. Strictest option.
     * - "none": Disable version checking entirely. This can result in corrupt data.
     */
    versionStrictness?: VersionStrictness;
}
export declare function parseSaveGame(options?: SaveGameParserOptions): ParseIterator<SaveGame>;
export declare function unparseSaveGame(saveGame: SaveGame): UnparseIterator;
