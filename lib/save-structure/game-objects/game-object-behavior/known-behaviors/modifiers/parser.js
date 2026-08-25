"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseModifiersExtraData = parseModifiersExtraData;
exports.unparseModifiersExtraData = unparseModifiersExtraData;
const utils_1 = require("../../../../../utils");
const parser_1 = require("../../../../../parser");
function* parseModifiersExtraData(templateParser) {
    const amounts = yield* parseModifiers("Klei.AI.AmountInstance", templateParser);
    const diseases = yield* parseModifiers("Klei.AI.DiseaseInstance", templateParser);
    const extraData = {
        amounts,
        diseases
    };
    return extraData;
}
function* unparseModifiersExtraData(extraData, templateUnparser) {
    yield* unparseModifiers(extraData.amounts, "Klei.AI.AmountInstance", templateUnparser);
    yield* unparseModifiers(extraData.diseases, "Klei.AI.DiseaseInstance", templateUnparser);
}
function* parseModifiers(modifierInstanceType, templateParser) {
    const count = yield (0, parser_1.readInt32)();
    const items = new Array(count);
    for (let i = 0; i < count; i++) {
        const modifier = yield* parseModifier(modifierInstanceType, templateParser);
        items[i] = modifier;
    }
    return items;
}
function* unparseModifiers(instances, modifierInstanceType, templateUnparser) {
    yield (0, parser_1.writeInt32)(instances.length);
    for (const instance of instances) {
        yield* unparseModifier(instance, modifierInstanceType, templateUnparser);
    }
}
function* parseModifier(modifierInstanceType, templateParser) {
    const name = yield (0, parser_1.readKleiString)();
    (0, utils_1.validateDotNetIdentifierName)(name);
    const dataLength = yield (0, parser_1.readInt32)();
    const startPos = yield (0, parser_1.getReaderPosition)();
    const value = yield* templateParser.parseByTemplate(modifierInstanceType);
    const endPos = yield (0, parser_1.getReaderPosition)();
    const dataRemaining = dataLength - (endPos - startPos);
    if (dataRemaining !== 0) {
        throw new Error(`Modifier "${name}" deserialized ${Math.abs(dataRemaining)} ${dataRemaining > 0 ? "less" : "more"} bytes type data than expected.`);
    }
    const instance = {
        name,
        value
    };
    return instance;
}
function* unparseModifier(instance, modifierInstanceType, templateUnparser) {
    yield (0, parser_1.writeKleiString)(instance.name);
    const token = yield (0, parser_1.writeDataLengthBegin)();
    yield* templateUnparser.unparseByTemplate(modifierInstanceType, instance.value);
    yield (0, parser_1.writeDataLengthEnd)(token);
}
//# sourceMappingURL=parser.js.map