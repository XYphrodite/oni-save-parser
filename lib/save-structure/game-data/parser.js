"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGameData = parseGameData;
exports.writeGameData = writeGameData;
const parser_1 = require("../../parser");
const utils_1 = require("../../utils");
const AssemblyTypeName = "Game+GameSaveData";
function* parseGameData({ parseByTemplate }) {
    const typeName = yield (0, parser_1.readKleiString)();
    (0, utils_1.validateDotNetIdentifierName)(typeName);
    if (typeName !== AssemblyTypeName) {
        throw new Error(`Expected type name "${AssemblyTypeName}" but got "${typeName}".`);
    }
    const gameData = yield* parseByTemplate(AssemblyTypeName);
    return gameData;
}
function* writeGameData(gameData, { unparseByTemplate }) {
    yield (0, parser_1.writeKleiString)(AssemblyTypeName);
    yield* unparseByTemplate(AssemblyTypeName, gameData);
}
//# sourceMappingURL=parser.js.map