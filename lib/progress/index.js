"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportProgress = reportProgress;
exports.progressReporter = progressReporter;
function reportProgress(message) {
    return {
        type: "progress",
        isMeta: true,
        message
    };
}
function progressReporter(onProgress) {
    return (instruction) => {
        if (instruction && instruction.type === "progress") {
            onProgress(instruction.message);
        }
        return instruction;
    };
}
//# sourceMappingURL=index.js.map