## 15.0.0

Fork of RoboPhred/oni-save-parser, targeting the base game with no DLC.

### Verified

- Save version 7.38 (build 744825, base game, no DLC) round-trips losslessly:
  parse -> write -> re-parse produced no diff, no simData change and no raw
  extra-data mismatch on a 435-cycle 4.4 MB colony.

### Fixed

- `Health.templateData` is `{ canBeIncapacitated }`; the typing still declared
  `CanBeIncapacitated` and a `State` field the game no longer writes.
- `MinionIdentity.arrivalTime` is a cycle number, not seconds. The digest was
  dividing it by 600 and reporting every duplicant as arriving on cycle 0.
- `MinionIdentity` gained `model`, `stickerType` and `personalityResourceId`;
  `bodyData` is gone, appearance moved to the Accessorizer behaviors.
- A duplicant with no role stores `"NoRole"`, now normalised to absent.

### Breaking

- Default `versionStrictness` is now `"major"` instead of `"minor"`. Saves newer than
  the verified list load instead of throwing.
- `CURRENT_VERSION_MINOR` is deprecated in favour of `VERIFIED_VERSION_MINORS`. The old
  name implied it tracked the game; it only ever tracked what had been tested.
- Requires Node 20+. Dropped the `text-encoding` polyfill in favour of the global
  `TextDecoder`/`TextEncoder`, and the unused `long` dependency.

### Added

- `buildSaveDigest(save, options)`: a save reduced to what can be reasoned about --
  hashes resolved to names, the object tail aggregated into counts, per-entity detail
  only for duplicants and geysers. `npm run dump -- <file.sav>` writes it as JSON.
- `buildFullDump(save, options)` and `--scope full` for the raw parsed model, with
  binaries as base64 and `simData` omitted by default.

- `isVerifiedVersion(major, minor)`, exported alongside the version constants.
- `getDLCIds(gameInfo)` and `isBaseGameSave(gameInfo)`. `SaveGameInfo` gained the
  `dlcIds` array newer builds write in place of the single `dlcId`.
- `npm run check -- <file.sav>` round-trip verifier: parses, writes, re-parses and diffs,
  reporting save version, DLC state and behaviors with unmodelled extra data.

### Fixed

- zlib results are copied out via their exact byte range. pako 2 can return a subarray
  of a larger chunk buffer, so reading `.buffer` directly would have appended garbage.

### Changed

- TypeScript 3.5 -> 5.6, pako 1 -> 2, prettier 1 -> 3, compile target ES2020.

## 14.0.0

- Bump version lack to 7.31

## 13.0.2

- Fix "no dlc" dlc marker.

## 13.0.1

- Update types for dlc marker on header.

## 13.0.0

- Bump version lock to 7.25 (Breath of Fresh Air update)
- Export ParseError
- Inherit error codes on ParseError
- Fix save version lock bypass not functioning.

## 12.0.0

- Bump version lock (dlc) to 7.23

## 11.1.0

- Allow version 7.17 (non-dlc)

## 11.0.0

- Bump version lock to 7.22

## 10.0.0

- Bump version lock to 7.17
- Handle new sim data section in save file.

## 9.0.0

- Bump version lock to 7.16 for AP
- Allow option to bypass version check.

## 8.1.2

- Fix mistyped `SpaceDestination.id`.

## 8.1.1

- Update SimHashes
- Update SpacecraftManager types.
- Greatly loosened strictness of .NET identifier validation. This should improve compatibility with mods, especially non-english ones.

## 8.1.0

- Update traits for RP.

## 8.0.0

- Bump version lock to 7.15 for RP.

## 7.2.0

- Add Allergies and Archaeologist traits.

## 7.1.0

- Update for save version 7.12

## 7.0.3

- Add assignableProxy to MinionIdentity
- Add various data structure default value helpers.

## 7.0.2

- Fix parse validator throwing errors on generic fields.

## 7.0.1

- Add salt water geyser to geyser names list.

## 7.0.0

- Bump version lock to 7.11 for LU.

## 6.0.3

- Return json-safe values for int64/uint64

## 6.0.2

- Provide MinionSkillNames constant.

## 6.0.1

- Update MinionResume for QOL3.

## 6.0.0

- Fix parsing 7.8. Requires backwards-incompatible change; no longer able to parse 7.7 and below.

## 5.2.1

- Enable loading versions 7.6 to 7.8.

## 5.2.0

- Add typings for gameData.customGameSettings
- Add SpacecraftManagerBehavior

## 5.1.5

- Sync sim hashes with game for space update.

## 5.1.4

- Add missing Foodie and SimpleTastes traits. Remove non-traits Caring and MedicalAid from traits list.

## 5.1.3

- Fix crash in accessory utilities when encountering game-generated null guid.

## 5.1.2

- Bump save file version to match rocketry update. No parser changes

## 5.1.1

- Update header version check to match official release of Expressive Update.

## 5.1.0

- Compatibility with Expressive Update.

## 5.0.0

- Make ACCESSORY consts be CamelCase consistent with other consts.
- Rename MinionRole to MinionRoleGroup to reflect its actual contents.
- Fix incorrect HashedString hashes due to case sensitivity.

## 4.2.3

- Fix crash on save from MinionModifierBehavior.

## 4.2.2

- Fix MinionModifierBehavior types. Again.

## 4.2.1

- Fix MinionModifierBehavior types.

## 4.2.0

- Fix MinionModifiers not exported.
- Add ACCESSORIES_BY_TYPE.

## 4.1.0

- Basic progress reporting (game object start only).
- Restore MinionModifiers.

## 4.0.0

- Rework accessory type code to handle non-ordinal and prefix-clashing accessory names.
  -- prefix clash: "hair" vs "hair_always"
  -- non-ordinal: "hair_always_DEFAULT"

## 3.2.1

- Fix AccessoryType.

## 3.2.0

- Add missing accessory slots.
- Added map tying minion identity bodyData slots to accessories.

## 3.1.1

- Fix PrimaryElementBehavior interface name.

## 3.1.0

- Add missing templateData typings to StorageBehavior.

## 3.0.1

- Export StorageBehavior.

## 3.0.0

- Include hard-coded enumeration and other constant data.
  -- SimHashes
  -- GeyserType
  -- HealthState

## 2.2.1

- Fix getBehavior not exported.

## 2.2.0

- Added support for parsing extra data of Storage behavior.
  Enables modifying the stored contents of all game objects that store items. This includes storage compactors, hydrogen and coal generators, and various other internal buffers used by buildings and creatures.
- Export TypeTemplate and related typings
- Export known GameObject types
