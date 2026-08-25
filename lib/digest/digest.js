"use strict";
/**
 * A save reduced to something worth reading.
 *
 * A save holds hundreds of thousands of game objects, so a verbatim dump says
 * very little for its size. This resolves hashes back to names, aggregates the
 * long tail into counts, and keeps per-entity detail only where entities are
 * few and individually meaningful (duplicants, geysers).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSaveDigest = buildSaveDigest;
const utils_1 = require("../save-structure/game-objects/game-object-behavior/utils");
const known_behaviors_1 = require("../save-structure/game-objects/game-object-behavior/known-behaviors");
const geyser_type_1 = require("../save-structure/const-data/geysers/geyser-type");
const template_enumerations_1 = require("../save-structure/const-data/template-enumerations");
const dlc_1 = require("../save-structure/const-data/dlc");
const version_validator_1 = require("../save-structure/version-validator");
function buildSaveDigest(save, options = {}) {
    const info = save.header.gameInfo;
    const top = options.top ?? 0;
    const collected = collectObjects(save);
    return {
        meta: {
            file: options.file,
            bytes: options.bytes,
            buildVersion: save.header.buildVersion,
            saveVersion: `${info.saveMajorVersion}.${info.saveMinorVersion}`,
            versionVerified: (0, version_validator_1.isVerifiedVersion)(info.saveMajorVersion, info.saveMinorVersion),
            baseGame: (0, dlc_1.isBaseGameSave)(info),
            dlcIds: (0, dlc_1.getDLCIds)(info),
            compressed: save.header.isCompressed,
        },
        colony: {
            name: info.baseName,
            originalSaveName: info.originalSaveName,
            cycles: info.numberOfCycles,
            duplicantCount: info.numberOfDuplicants,
            sandboxEnabled: info.sandboxEnabled,
            autoSave: info.isAutoSave,
            colonyGuid: info.colonyGuid,
            clusterId: info.clusterId,
        },
        world: {
            widthInCells: save.world.WidthInCells,
            heightInCells: save.world.HeightInCells,
            discoveredSurface: save.gameData?.savedInfo?.discoveredSurface,
        },
        difficulty: buildDifficulty(save),
        achievements: collected.achievements,
        duplicants: collected.duplicants,
        geysers: collected.geysers,
        objects: {
            groups: save.gameObjects.length,
            total: collected.totalObjects,
            stored: collected.storedItems,
            byPrefab: capCounts(collected.byPrefab, top),
        },
        materials: {
            note: "Element totals across game objects (buildings, debris, stored items). " +
                "World tiles are not game objects; they live in the unparsed simData blob.",
            byElement: capCounts(collected.byElement, top),
        },
        unmodelledBehaviors: collected.unmodelled,
    };
}
function buildDifficulty(save) {
    const settings = save.gameData?.customGameSettings;
    if (!settings) {
        return undefined;
    }
    const levels = {};
    for (const entry of settings.CurrentQualityLevelsBySetting ?? []) {
        const [key, value] = entry;
        levels[key] = value;
    }
    return {
        isCustomGame: settings.is_custom_game,
        customGameMode: settings.customGameMode,
        levels,
    };
}
function collectObjects(save) {
    const byPrefab = new Map();
    const byElement = new Map();
    const unmodelled = new Map();
    const duplicants = [];
    const geysers = [];
    let achievements;
    let totalObjects = 0;
    let storedItems = 0;
    const visit = (prefab, gameObject, stored) => {
        totalObjects++;
        if (stored) {
            storedItems++;
        }
        add(byPrefab, prefab, 1);
        for (const behavior of gameObject.behaviors) {
            if (!behavior.extraRaw) {
                continue;
            }
            const entry = unmodelled.get(behavior.name) ?? { count: 0, bytes: 0 };
            entry.count++;
            entry.bytes += behavior.extraRaw.byteLength;
            unmodelled.set(behavior.name, entry);
        }
        const elementData = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.PrimaryElementBehavior)?.templateData;
        if (elementData && elementData.Units > 0) {
            add(byElement, elementName(elementData.ElementID), elementData.Units);
        }
        if (prefab === "Minion") {
            duplicants.push(describeDuplicant(gameObject));
        }
        const tracker = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.ColonyAchievementTrackerBehavior);
        if (tracker?.extraData) {
            achievements = {
                earned: tracker.extraData.filter((a) => a.success).map((a) => a.id),
                failed: tracker.extraData.filter((a) => a.failed).map((a) => a.id),
                pending: tracker.extraData.filter((a) => !a.success && !a.failed)
                    .length,
            };
        }
        const geyser = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.GeyserBehavior);
        if (geyser) {
            geysers.push(describeGeyser(prefab, gameObject, geyser));
        }
        // Stored items are game objects in their own right, and hold the bulk of a
        // colony's resources. Walk into them rather than counting the container.
        const storage = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.StorageBehavior);
        for (const item of storage?.extraData ?? []) {
            visit(item.name, item, true);
        }
    };
    for (const group of save.gameObjects) {
        for (const gameObject of group.gameObjects) {
            visit(group.name, gameObject, false);
        }
    }
    return {
        totalObjects,
        storedItems,
        byPrefab,
        byElement,
        duplicants,
        geysers,
        achievements,
        unmodelled: Array.from(unmodelled.entries())
            .map(([behavior, entry]) => ({ behavior, ...entry }))
            .sort((a, b) => b.bytes - a.bytes),
    };
}
function describeDuplicant(gameObject) {
    const identity = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.MinionIdentityBehavior)?.templateData;
    const traits = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.AITraitsBehavior)?.templateData;
    const resume = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.MinionResumeBehavior)?.templateData;
    const attributes = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.AIAttributeLevelsBehavior)?.templateData;
    const health = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.HealthBehavior)?.templateData;
    return {
        name: identity?.name,
        gender: identity?.gender,
        arrivalCycle: identity?.arrivalTime,
        cell: cellOf(gameObject),
        traits: (traits?.TraitIds ?? []).filter((id) => id !== "None"),
        role: roleName(resume?.currentRole),
        targetRole: roleName(resume?.targetRole),
        totalExperience: round(resume?.totalExperienceGained),
        skills: masteredNames(resume?.MasteryBySkillID),
        attributes: attributeLevels(attributes?.saveLoadLevels),
        ...describeModifiers(gameObject),
        canBeIncapacitated: health?.canBeIncapacitated,
    };
}
function describeModifiers(gameObject) {
    const modifiers = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.MinionModifiersBehavior)?.extraData;
    if (!modifiers) {
        return {};
    }
    const amounts = {};
    for (const amount of modifiers.amounts ?? []) {
        const value = round(amount.value?.value);
        if (value != null) {
            amounts[amount.name] = value;
        }
    }
    const sicknesses = (modifiers.sicknesses ?? [])
        .map((sickness) => sickness.value?.diseaseId)
        .filter((id) => Boolean(id));
    return {
        amounts: Object.keys(amounts).length > 0 ? amounts : undefined,
        sicknesses: sicknesses.length > 0 ? sicknesses : undefined,
    };
}
function describeGeyser(prefab, gameObject, geyser) {
    const configuration = geyser.templateData?.configuration;
    return {
        prefab,
        type: configuration ? geyserTypeName(configuration.typeId) : undefined,
        cell: cellOf(gameObject),
        rolls: configuration
            ? {
                rate: round(configuration.rateRoll),
                iterationLength: round(configuration.iterationLengthRoll),
                iterationPercent: round(configuration.iterationPercentRoll),
                yearLength: round(configuration.yearLengthRoll),
                yearPercent: round(configuration.yearPercentRoll),
            }
            : undefined,
    };
}
function add(counts, key, amount) {
    counts.set(key, (counts.get(key) ?? 0) + amount);
}
function capCounts(counts, top) {
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const kept = top > 0 ? sorted.slice(0, top) : sorted;
    const out = {};
    for (const [key, count] of kept) {
        out[key] = round(count);
    }
    if (kept.length < sorted.length) {
        const rest = sorted.slice(kept.length);
        out[`(${rest.length} more)`] = round(rest.reduce((sum, [, count]) => sum + count, 0));
    }
    return out;
}
function cellOf(gameObject) {
    return {
        x: Math.floor(gameObject.position.x),
        y: Math.floor(gameObject.position.y),
    };
}
function masteredNames(mastery) {
    return (mastery ?? []).filter(([, earned]) => earned).map(([id]) => id);
}
function attributeLevels(levels) {
    if (!levels?.length) {
        return undefined;
    }
    const out = {};
    for (const { attributeId, level } of levels) {
        out[attributeId] = level;
    }
    return out;
}
function elementName(id) {
    const name = typeof id === "number" ? template_enumerations_1.SimHashes[id] : undefined;
    return name ?? `unknown(${String(id)})`;
}
function geyserTypeName(typeId) {
    if (typeId?.hash == null) {
        return "unknown";
    }
    return geyser_type_1.GeyserType[typeId.hash] ?? `unknown(${typeId.hash})`;
}
/** ONI stores "NoRole" rather than an empty string when nothing is assigned. */
function roleName(role) {
    return !role || role === "NoRole" ? undefined : role;
}
function round(value) {
    if (value == null || !Number.isFinite(value)) {
        return value;
    }
    return Math.round(value * 1000) / 1000;
}
//# sourceMappingURL=digest.js.map