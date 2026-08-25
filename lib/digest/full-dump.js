"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFullDump = buildFullDump;
exports.encodeBinaries = encodeBinaries;
/**
 * The whole parsed model, with binary values replaced by
 * `{ $binary: "<base64>", length }` so the result survives JSON.stringify.
 */
function buildFullDump(save, options = {}) {
    const { simData, ...rest } = save;
    return encodeBinaries({
        ...rest,
        simData: options.includeSim
            ? simData
            : { $omitted: "simData", length: simData.byteLength },
    });
}
function encodeBinaries(value) {
    if (value instanceof ArrayBuffer) {
        return {
            $binary: Buffer.from(value).toString("base64"),
            length: value.byteLength,
        };
    }
    if (ArrayBuffer.isView(value)) {
        const view = value;
        return {
            $binary: Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString("base64"),
            length: view.byteLength,
        };
    }
    if (Array.isArray(value)) {
        return value.map(encodeBinaries);
    }
    if (value && typeof value === "object") {
        const out = {};
        for (const [key, child] of Object.entries(value)) {
            out[key] = encodeBinaries(child);
        }
        return out;
    }
    return value;
}
//# sourceMappingURL=full-dump.js.map