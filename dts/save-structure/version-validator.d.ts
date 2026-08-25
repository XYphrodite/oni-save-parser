export declare const CURRENT_VERSION_MAJOR = 7;
/**
 * Minor save versions this parser has been round-trip verified against.
 *
 * A save file carries its own type templates, and unknown behavior extra-data
 * is preserved verbatim as `extraRaw`, so newer minor versions generally parse
 * and re-serialize correctly under "major" strictness. They are simply not
 * byte-verified until added to this list by the round-trip check
 * (`npm run check -- <file.sav>`).
 */
export declare const VERIFIED_VERSION_MINORS: number[];
/**
 * @deprecated Renamed to {@link VERIFIED_VERSION_MINORS}. The name was
 * misleading: it never tracked the game's current version, only the versions
 * this parser had been tested against.
 */
export declare const CURRENT_VERSION_MINOR: number[];
export type VersionStrictness = "none" | "major" | "minor";
/**
 * Whether this save version has been round-trip verified against this parser.
 * Parsing an unverified version is allowed under "major" strictness, but a
 * caller that writes the save back out should surface a warning.
 */
export declare function isVerifiedVersion(major: number, minor: number): boolean;
export declare function validateVersion(major: number, minor: number, strictness?: VersionStrictness): void;
export declare const E_VERSION_MAJOR = "E_VERSION_MAJOR";
export declare const E_VERSION_MINOR = "E_VERSION_MINOR";
