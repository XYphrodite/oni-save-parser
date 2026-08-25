"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readByte = readByte;
exports.readSByte = readSByte;
exports.readBytes = readBytes;
exports.readUInt16 = readUInt16;
exports.readInt16 = readInt16;
exports.readUInt32 = readUInt32;
exports.readInt32 = readInt32;
exports.readUInt64 = readUInt64;
exports.readInt64 = readInt64;
exports.readSingle = readSingle;
exports.readDouble = readDouble;
exports.readChars = readChars;
exports.readKleiString = readKleiString;
exports.skipBytes = skipBytes;
exports.readCompressed = readCompressed;
exports.getReaderPosition = getReaderPosition;
exports.isReadInstruction = isReadInstruction;
function readByte() {
    return {
        type: "read",
        dataType: "byte"
    };
}
function readSByte() {
    return {
        type: "read",
        dataType: "signed-byte"
    };
}
function readBytes(length) {
    return {
        type: "read",
        dataType: "byte-array",
        length
    };
}
function readUInt16() {
    return {
        type: "read",
        dataType: "uint-16"
    };
}
function readInt16() {
    return {
        type: "read",
        dataType: "int-16"
    };
}
function readUInt32() {
    return {
        type: "read",
        dataType: "uint-32"
    };
}
function readInt32() {
    return {
        type: "read",
        dataType: "int-32"
    };
}
function readUInt64() {
    return {
        type: "read",
        dataType: "uint-64"
    };
}
function readInt64() {
    return {
        type: "read",
        dataType: "int-64"
    };
}
function readSingle() {
    return {
        type: "read",
        dataType: "single"
    };
}
function readDouble() {
    return {
        type: "read",
        dataType: "double"
    };
}
function readChars(length) {
    return {
        type: "read",
        dataType: "chars",
        length
    };
}
function readKleiString() {
    return {
        type: "read",
        dataType: "klei-string"
    };
}
function skipBytes(length) {
    return {
        type: "read",
        dataType: "skip-bytes",
        length
    };
}
function readCompressed(parser) {
    return {
        type: "read",
        dataType: "compressed",
        parser
    };
}
function getReaderPosition() {
    return {
        type: "read",
        dataType: "reader-position"
    };
}
function isReadInstruction(value) {
    // TODO: Use a symbol or something to ensure this is a real parse instruction.
    return value && value.type === "read";
}
//# sourceMappingURL=read-instructions.js.map