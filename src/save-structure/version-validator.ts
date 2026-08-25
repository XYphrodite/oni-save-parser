export const CURRENT_VERSION_MAJOR = 7;

/**
 * Minor save versions this parser has been round-trip verified against.
 *
 * A save file carries its own type templates, and unknown behavior extra-data
 * is preserved verbatim as `extraRaw`, so newer minor versions generally parse
 * and re-serialize correctly under "major" strictness. They are simply not
 * byte-verified until added to this list by the round-trip check
 * (`npm run check -- <file.sav>`).
 */
export const VERIFIED_VERSION_MINORS = [31];

/**
 * @deprecated Renamed to {@link VERIFIED_VERSION_MINORS}. The name was
 * misleading: it never tracked the game's current version, only the versions
 * this parser had been tested against.
 */
export const CURRENT_VERSION_MINOR = VERIFIED_VERSION_MINORS;

export type VersionStrictness = "none" | "major" | "minor";

/**
 * Whether this save version has been round-trip verified against this parser.
 * Parsing an unverified version is allowed under "major" strictness, but a
 * caller that writes the save back out should surface a warning.
 */
export function isVerifiedVersion(major: number, minor: number): boolean {
  return (
    major === CURRENT_VERSION_MAJOR && VERIFIED_VERSION_MINORS.includes(minor)
  );
}

export function validateVersion(
  major: number,
  minor: number,
  strictness: VersionStrictness = "major"
) {
  if (strictness === "none") {
    return;
  }

  if (major !== CURRENT_VERSION_MAJOR) {
    const err = new Error(
      `Save major version "${major}" is not supported by this parser. Expected major version "${CURRENT_VERSION_MAJOR}".`
    );
    (err as any).code = E_VERSION_MAJOR;
    throw err;
  }

  if (strictness === "minor" && !isVerifiedVersion(major, minor)) {
    const err = new Error(
      `Save version "${major}.${minor}" has not been verified against this parser. ` +
        `Verified versions: ${VERIFIED_VERSION_MINORS.map(
          (x) => `${CURRENT_VERSION_MAJOR}.${x}`
        ).join(", ")}. ` +
        `Pass versionStrictness: "major" to parse it anyway.`
    );
    (err as any).code = E_VERSION_MINOR;
    throw err;
  }
}

export const E_VERSION_MAJOR = "E_VERSION_MAJOR";
export const E_VERSION_MINOR = "E_VERSION_MINOR";
