"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E_VERSION_MINOR = exports.E_VERSION_MAJOR = exports.CURRENT_VERSION_MINOR = exports.VERIFIED_VERSION_MINORS = exports.CURRENT_VERSION_MAJOR = void 0;
exports.isVerifiedVersion = isVerifiedVersion;
exports.validateVersion = validateVersion;
exports.CURRENT_VERSION_MAJOR = 7;
/**
 * Minor save versions this parser has been round-trip verified against.
 *
 * A save file carries its own type templates, and unknown behavior extra-data
 * is preserved verbatim as `extraRaw`, so newer minor versions generally parse
 * and re-serialize correctly under "major" strictness. They are simply not
 * byte-verified until added to this list by the round-trip check
 * (`npm run check -- <file.sav>`).
 */
exports.VERIFIED_VERSION_MINORS = [31];
/**
 * @deprecated Renamed to {@link VERIFIED_VERSION_MINORS}. The name was
 * misleading: it never tracked the game's current version, only the versions
 * this parser had been tested against.
 */
exports.CURRENT_VERSION_MINOR = exports.VERIFIED_VERSION_MINORS;
/**
 * Whether this save version has been round-trip verified against this parser.
 * Parsing an unverified version is allowed under "major" strictness, but a
 * caller that writes the save back out should surface a warning.
 */
function isVerifiedVersion(major, minor) {
    return (major === exports.CURRENT_VERSION_MAJOR && exports.VERIFIED_VERSION_MINORS.includes(minor));
}
function validateVersion(major, minor, strictness = "major") {
    if (strictness === "none") {
        return;
    }
    if (major !== exports.CURRENT_VERSION_MAJOR) {
        const err = new Error(`Save major version "${major}" is not supported by this parser. Expected major version "${exports.CURRENT_VERSION_MAJOR}".`);
        err.code = exports.E_VERSION_MAJOR;
        throw err;
    }
    if (strictness === "minor" && !isVerifiedVersion(major, minor)) {
        const err = new Error(`Save version "${major}.${minor}" has not been verified against this parser. ` +
            `Verified versions: ${exports.VERIFIED_VERSION_MINORS.map((x) => `${exports.CURRENT_VERSION_MAJOR}.${x}`).join(", ")}. ` +
            `Pass versionStrictness: "major" to parse it anyway.`);
        err.code = exports.E_VERSION_MINOR;
        throw err;
    }
}
exports.E_VERSION_MAJOR = "E_VERSION_MAJOR";
exports.E_VERSION_MINOR = "E_VERSION_MINOR";
//# sourceMappingURL=version-validator.js.map