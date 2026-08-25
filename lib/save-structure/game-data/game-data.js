"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityLevelSettingValues = exports.SandboxModeSettings = exports.StressBreaksSettings = exports.CalorieBurnSettings = exports.MoraleSettings = exports.StressSettings = exports.ImmuneSystemSettings = void 0;
const utils_1 = require("../../utils");
exports.ImmuneSystemSettings = [
    (0, utils_1.typed)("Compromised"),
    (0, utils_1.typed)("Weak"),
    (0, utils_1.typed)("Default"),
    (0, utils_1.typed)("Strong"),
    (0, utils_1.typed)("Invincible")
];
exports.StressSettings = [
    (0, utils_1.typed)("Doomed"),
    (0, utils_1.typed)("Pessimistic"),
    (0, utils_1.typed)("Default"),
    (0, utils_1.typed)("Optimistic"),
    (0, utils_1.typed)("Indomitable")
];
exports.MoraleSettings = [
    (0, utils_1.typed)("VeryHard"),
    (0, utils_1.typed)("Hard"),
    (0, utils_1.typed)("Default"),
    (0, utils_1.typed)("Easy"),
    (0, utils_1.typed)("Disabled")
];
exports.CalorieBurnSettings = [
    (0, utils_1.typed)("VeryHard"),
    (0, utils_1.typed)("Hard"),
    (0, utils_1.typed)("Default"),
    (0, utils_1.typed)("Easy"),
    (0, utils_1.typed)("Disabled")
];
exports.StressBreaksSettings = ["Disabled", "Default"];
exports.SandboxModeSettings = ["Disabled", "Enabled"];
exports.QualityLevelSettingValues = {
    ImmuneSystem: exports.ImmuneSystemSettings,
    Stress: exports.StressSettings,
    StressBreaks: exports.StressBreaksSettings,
    Morale: exports.MoraleSettings,
    CalorieBurn: exports.CalorieBurnSettings,
    SandboxMode: exports.SandboxModeSettings
};
//# sourceMappingURL=game-data.js.map