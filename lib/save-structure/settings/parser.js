"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSettings = parseSettings;
exports.unparseSettings = unparseSettings;
const parser_1 = require("../../parser");
const utils_1 = require("../../utils");
const AssemblyTypeName = "Game+Settings";
function* parseSettings({ parseByTemplate }) {
    const typeName = yield (0, parser_1.readKleiString)();
    (0, utils_1.validateDotNetIdentifierName)(typeName);
    if (typeName !== AssemblyTypeName) {
        throw new Error(`Expected type name "${AssemblyTypeName}" but got "${typeName}".`);
    }
    return yield* parseByTemplate(AssemblyTypeName);
}
function* unparseSettings(settings, { unparseByTemplate }) {
    yield (0, parser_1.writeKleiString)(AssemblyTypeName);
    yield* unparseByTemplate(AssemblyTypeName, settings);
}
//# sourceMappingURL=parser.js.map