"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseByTemplate = parseByTemplate;
exports.unparseByTemplate = unparseByTemplate;
const type_data_parser_1 = require("./type-data-parser");
function* parseByTemplate(templates, templateName) {
    const template = templates.find(x => x.name === templateName);
    if (!template) {
        throw new Error(`Template "${templateName}" not found.`);
    }
    const result = {};
    for (let field of template.fields) {
        const { name, type } = field;
        const value = yield* (0, type_data_parser_1.parseByType)(type, templates);
        result[name] = value;
    }
    for (let prop of template.properties) {
        const { name, type } = prop;
        const value = yield* (0, type_data_parser_1.parseByType)(type, templates);
        result[name] = value;
    }
    return result;
}
function* unparseByTemplate(templates, templateName, obj) {
    const template = templates.find(x => x.name === templateName);
    if (!template) {
        throw new Error(`Template "${templateName}" not found.`);
    }
    for (let field of template.fields) {
        const { name, type } = field;
        const value = obj[name];
        yield* (0, type_data_parser_1.unparseByType)(value, type, templates);
    }
    for (let prop of template.properties) {
        const { name, type } = prop;
        const value = obj[name];
        yield* (0, type_data_parser_1.unparseByType)(value, type, templates);
    }
}
//# sourceMappingURL=template-data-parser.js.map