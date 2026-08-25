"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGameObject = parseGameObject;
exports.unparseGameObject = unparseGameObject;
const parser_1 = require("../../../parser");
const data_types_parser_1 = require("../../../save-structure/data-types/data-types-parser");
const parser_2 = require("../game-object-behavior/parser");
function* parseGameObject(templateParser) {
    const position = yield* (0, data_types_parser_1.parseVector3)();
    const rotation = yield* (0, data_types_parser_1.parseQuaternion)();
    const scale = yield* (0, data_types_parser_1.parseVector3)();
    const folder = yield (0, parser_1.readByte)();
    const behaviorCount = yield (0, parser_1.readInt32)();
    const behaviors = new Array(behaviorCount);
    for (let i = 0; i < behaviorCount; i++) {
        behaviors[i] = yield* (0, parser_2.parseGameObjectBehavior)(templateParser);
    }
    const gameObject = {
        position,
        rotation,
        scale,
        folder,
        behaviors
    };
    return gameObject;
}
function* unparseGameObject(gameObject, templateUnparser) {
    const { position, rotation, scale, folder, behaviors } = gameObject;
    yield* (0, data_types_parser_1.unparseVector3)(position);
    yield* (0, data_types_parser_1.unparseQuaternion)(rotation);
    yield* (0, data_types_parser_1.unparseVector3)(scale);
    yield (0, parser_1.writeByte)(folder);
    yield (0, parser_1.writeInt32)(behaviors.length);
    for (const behavior of behaviors) {
        yield* (0, parser_2.unparseGameObjectBehavior)(behavior, templateUnparser);
    }
}
//# sourceMappingURL=parser.js.map