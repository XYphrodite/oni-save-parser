"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taggedParseStart = taggedParseStart;
exports.taggedParseEnd = taggedParseEnd;
function taggedParseStart(tag, instanceName) {
    return {
        type: "tagged-parse:start",
        isMeta: true,
        tag,
        instanceName
    };
}
function taggedParseEnd(tag, instanceName) {
    return {
        type: "tagged-parse:end",
        isMeta: true,
        tag,
        instanceName
    };
}
//# sourceMappingURL=instructions.js.map