"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorld = parseWorld;
exports.unparseWorld = unparseWorld;
const parser_1 = require("../../parser");
const utils_1 = require("../../utils");
const AssemblyTypeName = "Klei.SaveFileRoot";
function* parseWorld({ parseByTemplate }) {
    const typeName = yield (0, parser_1.readKleiString)();
    (0, utils_1.validateDotNetIdentifierName)(typeName);
    if (typeName !== AssemblyTypeName) {
        throw new Error(`Expected type name "${AssemblyTypeName}" but got "${typeName}".`);
    }
    const world = yield* parseByTemplate(AssemblyTypeName);
    return world;
}
function* unparseWorld(world, { unparseByTemplate }) {
    yield (0, parser_1.writeKleiString)(AssemblyTypeName);
    yield* unparseByTemplate(AssemblyTypeName, world);
}
//# sourceMappingURL=parser.js.map