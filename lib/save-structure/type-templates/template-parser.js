"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTemplates = parseTemplates;
exports.unparseTemplates = unparseTemplates;
const parser_1 = require("../../parser");
const utils_1 = require("../../utils");
const type_info_parser_1 = require("./type-info-parser");
function* parseTemplates() {
    const templateCount = yield (0, parser_1.readInt32)();
    const templates = new Array(templateCount);
    for (let i = 0; i < templateCount; i++) {
        const template = yield* parseTemplate();
        templates[i] = template;
    }
    return templates;
}
function* unparseTemplates(templates) {
    yield (0, parser_1.writeInt32)(templates.length);
    for (const template of templates) {
        yield* unparseTemplate(template);
    }
}
function* parseTemplate() {
    const name = (0, utils_1.validateDotNetIdentifierName)(yield (0, parser_1.readKleiString)());
    const fieldCount = yield (0, parser_1.readInt32)();
    const propCount = yield (0, parser_1.readInt32)();
    const fields = new Array(fieldCount);
    for (let i = 0; i < fieldCount; i++) {
        const name = (0, utils_1.validateDotNetIdentifierName)(yield (0, parser_1.readKleiString)());
        const type = yield* (0, type_info_parser_1.parseTypeInfo)();
        fields[i] = {
            name,
            type
        };
    }
    const properties = new Array(propCount);
    for (let i = 0; i < propCount; i++) {
        const name = (0, utils_1.validateDotNetIdentifierName)(yield (0, parser_1.readKleiString)());
        const type = yield* (0, type_info_parser_1.parseTypeInfo)();
        properties[i] = {
            name,
            type
        };
    }
    const template = {
        name,
        fields,
        properties
    };
    return template;
}
function* unparseTemplate(template) {
    yield (0, parser_1.writeKleiString)(template.name);
    yield (0, parser_1.writeInt32)(template.fields.length);
    yield (0, parser_1.writeInt32)(template.properties.length);
    for (const field of template.fields) {
        const { name, type } = field;
        yield (0, parser_1.writeKleiString)(name);
        yield* (0, type_info_parser_1.unparseTypeInfo)(type);
    }
    for (const prop of template.properties) {
        const { name, type } = prop;
        yield (0, parser_1.writeKleiString)(name);
        yield* (0, type_info_parser_1.unparseTypeInfo)(type);
    }
}
//# sourceMappingURL=template-parser.js.map