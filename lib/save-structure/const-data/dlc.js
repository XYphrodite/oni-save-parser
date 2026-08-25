"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DLCIds = void 0;
exports.getDLCIds = getDLCIds;
exports.isBaseGameSave = isBaseGameSave;
var DLCIds;
(function (DLCIds) {
    DLCIds["None"] = "";
    DLCIds["SpacedOut"] = "EXPANSION1_ID";
})(DLCIds || (exports.DLCIds = DLCIds = {}));
/**
 * The DLC ids active in a save.
 *
 * Older builds carried a single `dlcId`; newer ones carry a `dlcIds` array
 * because several content packs can be enabled at once. Ids not listed in
 * {@link DLCIds} are returned as-is rather than dropped.
 */
function getDLCIds(gameInfo) {
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
function isBaseGameSave(gameInfo) {
    return getDLCIds(gameInfo).length === 0;
}
//# sourceMappingURL=dlc.js.map