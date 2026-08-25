"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStorageExtraData = parseStorageExtraData;
exports.unparseStorageExtraData = unparseStorageExtraData;
const utils_1 = require("../../../../../utils");
const parser_1 = require("../../../../../parser");
const parser_2 = require("../../../game-object/parser");
function* parseStorageExtraData(templateParser) {
    const itemCount = yield (0, parser_1.readInt32)();
    const items = new Array(itemCount);
    for (let i = 0; i < itemCount; i++) {
        const name = yield (0, parser_1.readKleiString)();
        (0, utils_1.validateDotNetIdentifierName)(name);
        const gameObject = yield* (0, parser_2.parseGameObject)(templateParser);
        items[i] = {
            name,
            ...gameObject
        };
    }
    return items;
}
function* unparseStorageExtraData(extraData, templateUnparser) {
    yield (0, parser_1.writeInt32)(extraData.length);
    for (const gameObject of extraData) {
        yield (0, parser_1.writeKleiString)(gameObject.name);
        yield* (0, parser_2.unparseGameObject)(gameObject, templateUnparser);
    }
}
//# sourceMappingURL=parser.js.map