"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSaveGame = parseSaveGame;
exports.unparseSaveGame = unparseSaveGame;
const parser_1 = require("../parser");
const parser_2 = require("./header/parser");
const template_parser_1 = require("./type-templates/template-parser");
const template_data_parser_1 = require("./type-templates/template-data-parser");
const parser_3 = require("./world/parser");
const parser_4 = require("./settings/parser");
const parser_5 = require("./game-objects/parser");
const parser_6 = require("./game-data/parser");
const version_validator_1 = require("./version-validator");
const SAVE_HEADER = "KSAV";
function* parseSaveGame(options = {}) {
    const header = yield* (0, parser_2.parseHeader)();
    const { saveMajorVersion, saveMinorVersion } = header.gameInfo;
    const versionStrictness = options.versionStrictness || "major";
    if (versionStrictness !== "none") {
        (0, version_validator_1.validateVersion)(saveMajorVersion, saveMinorVersion, versionStrictness);
    }
    const templates = yield* (0, template_parser_1.parseTemplates)();
    const context = makeSaveParserContext(header, templates);
    let body;
    if (header.isCompressed) {
        body = yield (0, parser_1.readCompressed)(parseSaveBody(context));
    }
    else {
        body = yield* parseSaveBody(context);
    }
    const saveGame = {
        header,
        templates,
        ...body,
    };
    return saveGame;
}
function* parseSaveBody(context) {
    const worldMarker = yield (0, parser_1.readKleiString)();
    if (worldMarker !== "world") {
        throw new Error(`Expected "world" string.`);
    }
    const world = yield* (0, parser_3.parseWorld)(context);
    const settings = yield* (0, parser_4.parseSettings)(context);
    const simDataLength = yield (0, parser_1.readInt32)();
    const simData = yield (0, parser_1.readBytes)(simDataLength);
    const ksav = yield (0, parser_1.readChars)(SAVE_HEADER.length);
    if (ksav !== SAVE_HEADER) {
        throw new Error(`Failed to parse ksav header: Expected "${SAVE_HEADER}" but got "${ksav}" (${Array.from(ksav).map((x) => x.charCodeAt(0))})`);
    }
    const versionMajor = yield (0, parser_1.readInt32)();
    const versionMinor = yield (0, parser_1.readInt32)();
    // The header contains this same data and validates it.
    // validateVersion(versionMajor, versionMinor);
    const gameObjects = yield* (0, parser_5.parseGameObjects)(context);
    const gameData = yield* (0, parser_6.parseGameData)(context);
    const body = {
        world,
        settings,
        simData,
        version: {
            major: versionMajor,
            minor: versionMinor,
        },
        gameObjects,
        gameData,
    };
    return body;
}
function makeSaveParserContext(header, templates) {
    return {
        ...header,
        parseByTemplate: (templateName) => (0, template_data_parser_1.parseByTemplate)(templates, templateName),
    };
}
function* unparseSaveGame(saveGame) {
    yield* (0, parser_2.unparseHeader)(saveGame.header);
    yield* (0, template_parser_1.unparseTemplates)(saveGame.templates);
    const context = makeSaveWriterContext(saveGame.header, saveGame.templates);
    if (saveGame.header.isCompressed) {
        yield (0, parser_1.writeCompressed)(unparseSaveBody(saveGame, context));
    }
    else {
        yield* unparseSaveBody(saveGame, context);
    }
}
function* unparseSaveBody(saveGame, context) {
    yield (0, parser_1.writeKleiString)("world");
    yield* (0, parser_3.unparseWorld)(saveGame.world, context);
    yield* (0, parser_4.unparseSettings)(saveGame.settings, context);
    yield (0, parser_1.writeInt32)(saveGame.simData.byteLength);
    yield (0, parser_1.writeBytes)(saveGame.simData);
    yield (0, parser_1.writeChars)(SAVE_HEADER);
    yield (0, parser_1.writeInt32)(saveGame.version.major);
    yield (0, parser_1.writeInt32)(saveGame.version.minor);
    yield* (0, parser_5.unparseGameObjects)(saveGame.gameObjects, context);
    yield* (0, parser_6.writeGameData)(saveGame.gameData, context);
}
function makeSaveWriterContext(header, templates) {
    return {
        ...header,
        unparseByTemplate: template_data_parser_1.unparseByTemplate.bind(null, templates),
    };
}
//# sourceMappingURL=parser.js.map