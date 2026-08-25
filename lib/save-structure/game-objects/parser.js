"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGameObjects = parseGameObjects;
exports.unparseGameObjects = unparseGameObjects;
const parser_1 = require("../../parser");
const parser_2 = require("./game-object-group/parser");
function* parseGameObjects(templateParser) {
    const count = yield (0, parser_1.readInt32)();
    const groups = new Array(count);
    for (let i = 0; i < count; i++) {
        groups[i] = yield* (0, parser_2.parseGameObjectGroup)(templateParser);
    }
    return groups;
}
function* unparseGameObjects(lists, templateWriter) {
    yield (0, parser_1.writeInt32)(lists.length);
    for (const group of lists) {
        yield* (0, parser_2.unparseGameObjectGroup)(group, templateWriter);
    }
}
//# sourceMappingURL=parser.js.map