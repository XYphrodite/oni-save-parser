"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMetaInstruction = isMetaInstruction;
function isMetaInstruction(inst) {
    return typeof inst === "object" && inst !== null && !!inst.isMeta;
}
//# sourceMappingURL=types.js.map