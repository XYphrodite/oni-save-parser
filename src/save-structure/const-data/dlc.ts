import { SaveGameInfo } from "../header/header";

export enum DLCIds {
  None = "",
  SpacedOut = "EXPANSION1_ID",
}

/**
 * The DLC ids active in a save.
 *
 * Older builds carried a single `dlcId`; newer ones carry a `dlcIds` array
 * because several content packs can be enabled at once. Ids not listed in
 * {@link DLCIds} are returned as-is rather than dropped.
 */
export function getDLCIds(gameInfo: SaveGameInfo): string[] {
  if (gameInfo.dlcIds && gameInfo.dlcIds.length > 0) {
    return gameInfo.dlcIds.filter((x) => x !== DLCIds.None);
  }
  return gameInfo.dlcId && gameInfo.dlcId !== DLCIds.None
    ? [gameInfo.dlcId]
    : [];
}

/**
 * Whether this save comes from the base game with no content packs enabled.
 */
export function isBaseGameSave(gameInfo: SaveGameInfo): boolean {
  return getDLCIds(gameInfo).length === 0;
}
