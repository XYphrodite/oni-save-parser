"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZlibDataReader = void 0;
const pako_1 = require("pako");
const array_reader_1 = require("./array-reader");
const utils_1 = require("../utils");
class ZlibDataReader extends array_reader_1.ArrayDataReader {
    constructor(data) {
        // ONI uses Ionic.Zlib.  More specifically, this:
        //  https://github.com/jstedfast/Ionic.Zlib/blob/master/Ionic.Zlib/ZlibStream.cs
        const deflated = (0, pako_1.inflate)(data, {
            windowBits: 15,
        });
        super((0, utils_1.toExactBuffer)(deflated));
    }
}
exports.ZlibDataReader = ZlibDataReader;
//# sourceMappingURL=zlib-reader.js.map