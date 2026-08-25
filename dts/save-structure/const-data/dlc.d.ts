import { SaveGameInfo } from "../header/header";
export declare enum DLCIds {
    None = "",
    SpacedOut = "EXPANSION1_ID"
}
/**
 * The DLC ids active in a save.
 *
 * Older builds carried a single `dlcId`; newer ones carry a `dlcIds` array
 * because several content packs can be enabled at once. Ids not listed in
 * {@link DLCIds} are returned as-is rather than dropped.
 */
export declare function getDLCIds(gameInfo: SaveGameInfo): string[];
/**
 * Whether this save comes from the base game with no content packs enabled.
 */
export declare function isBaseGameSave(gameInfo: SaveGameInfo): boolean;
