"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVerifiedVersion = exports.VERIFIED_VERSION_MINORS = exports.CURRENT_VERSION_MAJOR = exports.E_VERSION_MINOR = exports.E_VERSION_MAJOR = exports.tagReporter = exports.progressReporter = exports.ParseError = void 0;
exports.parseSaveGame = parseSaveGame;
exports.writeSaveGame = writeSaveGame;
const binary_serializer_1 = require("./binary-serializer");
const parser_1 = require("./parser");
const parser_2 = require("./save-structure/parser");
__exportStar(require("./save-structure"), exports);
__exportStar(require("./save-structure/data-types"), exports);
__exportStar(require("./binary-serializer/types"), exports);
var parser_3 = require("./parser");
Object.defineProperty(exports, "ParseError", { enumerable: true, get: function () { return parser_3.ParseError; } });
var progress_1 = require("./progress");
Object.defineProperty(exports, "progressReporter", { enumerable: true, get: function () { return progress_1.progressReporter; } });
var tagger_1 = require("./tagger");
Object.defineProperty(exports, "tagReporter", { enumerable: true, get: function () { return tagger_1.tagReporter; } });
var version_validator_1 = require("./save-structure/version-validator");
Object.defineProperty(exports, "E_VERSION_MAJOR", { enumerable: true, get: function () { return version_validator_1.E_VERSION_MAJOR; } });
Object.defineProperty(exports, "E_VERSION_MINOR", { enumerable: true, get: function () { return version_validator_1.E_VERSION_MINOR; } });
Object.defineProperty(exports, "CURRENT_VERSION_MAJOR", { enumerable: true, get: function () { return version_validator_1.CURRENT_VERSION_MAJOR; } });
Object.defineProperty(exports, "VERIFIED_VERSION_MINORS", { enumerable: true, get: function () { return version_validator_1.VERIFIED_VERSION_MINORS; } });
Object.defineProperty(exports, "isVerifiedVersion", { enumerable: true, get: function () { return version_validator_1.isVerifiedVersion; } });
function parseSaveGame(data, opts) {
    let interceptor = undefined;
    let parserOptions = {};
    if (typeof opts === "function") {
        interceptor = opts;
    }
    else if (opts != null) {
        parserOptions = opts;
        interceptor = opts.interceptor;
    }
    let reader = new binary_serializer_1.ArrayDataReader(data);
    const saveGame = (0, parser_1.parse)(reader, (0, parser_2.parseSaveGame)(parserOptions), interceptor);
    return saveGame;
}
function writeSaveGame(save, interceptor) {
    const writer = new binary_serializer_1.ArrayDataWriter();
    (0, parser_1.unparse)(writer, (0, parser_2.unparseSaveGame)(save), interceptor);
    return writer.getBytes();
}
__exportStar(require("./digest"), exports);
//# sourceMappingURL=index.js.map