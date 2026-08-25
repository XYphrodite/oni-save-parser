"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeByte = writeByte;
exports.writeSByte = writeSByte;
exports.writeBytes = writeBytes;
exports.writeUInt16 = writeUInt16;
exports.writeInt16 = writeInt16;
exports.writeUInt32 = writeUInt32;
exports.writeInt32 = writeInt32;
exports.writeUInt64 = writeUInt64;
exports.writeInt64 = writeInt64;
exports.writeSingle = writeSingle;
exports.writeDouble = writeDouble;
exports.writeChars = writeChars;
exports.writeKleiString = writeKleiString;
exports.getWriterPosition = getWriterPosition;
exports.writeDataLengthBegin = writeDataLengthBegin;
exports.writeDataLengthEnd = writeDataLengthEnd;
exports.writeCompressed = writeCompressed;
exports.isWriteInstruction = isWriteInstruction;
function writeByte(value) {
    return {
        type: "write",
        dataType: "byte",
        value
    };
}
function writeSByte(value) {
    return {
        type: "write",
        dataType: "signed-byte",
        value
    };
}
function writeBytes(bytes) {
    return {
        type: "write",
        dataType: "byte-array",
        value: bytes
    };
}
function writeUInt16(value) {
    return {
        type: "write",
        dataType: "uint-16",
        value
    };
}
function writeInt16(value) {
    return {
        type: "write",
        dataType: "int-16",
        value
    };
}
function writeUInt32(value) {
    return {
        type: "write",
        dataType: "uint-32",
        value
    };
}
function writeInt32(value) {
    return {
        type: "write",
        dataType: "int-32",
        value
    };
}
function writeUInt64(value) {
    return {
        type: "write",
        dataType: "uint-64",
        value
    };
}
function writeInt64(value) {
    return {
        type: "write",
        dataType: "int-64",
        value
    };
}
function writeSingle(value) {
    return {
        type: "write",
        dataType: "single",
        value
    };
}
function writeDouble(value) {
    return {
        type: "write",
        dataType: "double",
        value
    };
}
function writeChars(value) {
    return {
        type: "write",
        dataType: "chars",
        value
    };
}
function writeKleiString(value) {
    return {
        type: "write",
        dataType: "klei-string",
        value
    };
}
function getWriterPosition() {
    return {
        type: "write",
        dataType: "writer-position"
    };
}
function writeDataLengthBegin(startPosition) {
    return {
        type: "write",
        dataType: "data-length:begin",
        startPosition
    };
}
function writeDataLengthEnd(token) {
    return {
        type: "write",
        dataType: "data-length:end",
        token
    };
}
function writeCompressed(unparser) {
    return {
        type: "write",
        dataType: "compressed",
        unparser
    };
}
function isWriteInstruction(value) {
    // TODO: Use a symbol or something to ensure this is a real parse instruction.
    return value && value.type === "write";
}
//# sourceMappingURL=write-instructions.js.map