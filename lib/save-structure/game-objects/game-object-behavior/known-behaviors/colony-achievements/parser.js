"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseColonyAchievementsExtraData = parseColonyAchievementsExtraData;
exports.unparseColonyAchievementsExtraData = unparseColonyAchievementsExtraData;
const utils_1 = require("../../../../../utils");
const parser_1 = require("../../../../../parser");
function* parseColonyAchievementsExtraData() {
    const count = yield (0, parser_1.readInt32)();
    const achievements = new Array(count);
    for (let i = 0; i < count; i++) {
        const id = yield (0, parser_1.readKleiString)();
        (0, utils_1.validateDotNetIdentifierName)(id);
        const success = yield (0, parser_1.readByte)();
        const failed = yield (0, parser_1.readByte)();
        achievements[i] = {
            id,
            success: Boolean(success),
            failed: Boolean(failed),
        };
    }
    return achievements;
}
function* unparseColonyAchievementsExtraData(achievements) {
    yield (0, parser_1.writeInt32)(achievements.length);
    for (const { id, success, failed } of achievements) {
        yield (0, parser_1.writeKleiString)(id);
        yield (0, parser_1.writeByte)(success ? 1 : 0);
        yield (0, parser_1.writeByte)(failed ? 1 : 0);
    }
}
//# sourceMappingURL=parser.js.map