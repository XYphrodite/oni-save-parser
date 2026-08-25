"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBehavior = getBehavior;
function getBehavior(gameObject, name) {
    return gameObject.behaviors.find(x => x.name === name);
}
//# sourceMappingURL=utils.js.map