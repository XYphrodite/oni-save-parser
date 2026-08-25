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
        research: buildResearch(save),
        duplicants: collected.duplicants,
        geysers: collected.geysers,
        power: collected.power,
        buildings: collected.buildings,
        plants: collected.plants,
        objects: {
            groups: save.gameObjects.length,
            total: collected.totalObjects,
            stored: collected.storedItems,
            byPrefab: capCounts(collected.byPrefab, top),
        },
        materials: {
            note: "Element totals across game objects (buildings, debris, stored items). " +
                "World tiles are not game objects; they live in the unparsed simData blob.",
            byElement: capElements(collected.byElement, top),
        },
        unmodelledBehaviors: collected.unmodelled,
    };
}
/**
 * The research tree, read off the global SaveGame object.
 *
 * Reports the pending techs rather than the completed ones: past the early
 * game the completed list is the longer and less interesting half.
 */
function buildResearch(save) {
    const research = findGlobalBehavior(save, "Research")?.templateData;
    const techs = research?.saveData?.techs;
    if (!techs) {
        return undefined;
    }
    const points = {};
    for (const entry of research.globalPointInventory?.PointsByTypeID ?? []) {
        const [type, amount] = entry;
        points[type] = round(amount);
    }
    return {
        completed: techs.filter((t) => t.complete).length,
        total: techs.length,
        active: research.saveData.activeResearchId || undefined,
        queued: research.saveData.targetResearchId || undefined,
        points,
        pending: techs.filter((t) => !t.complete).map((t) => t.techId),
    };
}
/**
 * Find a behavior on the singleton "SaveGame" object, which carries the
 * colony-wide managers rather than anything placed in the world.
 */
function findGlobalBehavior(save, name) {
    const group = save.gameObjects.find((g) => g.name === "SaveGame");
    return group?.gameObjects[0]?.behaviors.find((b) => b.name === name);
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
    const power = {
        storedJoules: 0,
        batteries: 0,
        transformers: 0,
        generators: 0,
        consumers: 0,
    };
    const buildings = { total: 0, disabled: 0, damaged: 0 };
    const plants = { total: 0, readyToHarvest: 0 };
    /** prefab -> hit point value -> how many buildings sit at that value. */
    const hitpointsByPrefab = new Map();
    let currentPrefab = "";
    /**
     * Power buffers, classified per object rather than per behavior.
     *
     * A transformer carries its own `Battery` behavior for its internal buffer,
     * so counting batteries behavior-by-behavior files every transformer as a
     * battery as well.
     */
    const readPowerStats = (gameObject) => {
        let joules = 0;
        let isTransformer = false;
        let isBattery = false;
        let isGenerator = false;
        for (const behavior of gameObject.behaviors) {
            const data = behavior.templateData;
            switch (behavior.name) {
                case "PowerTransformer":
                    isTransformer = true;
                    break;
                case "Battery":
                case "BatterySmart":
                    isBattery = true;
                    break;
                case "EnergyGenerator":
                    isGenerator = true;
                    break;
                default:
                    continue;
            }
            joules += data?.joulesAvailable ?? 0;
        }
        if (isTransformer) {
            power.transformers++;
        }
        else if (isBattery) {
            power.batteries++;
        }
        if (isGenerator) {
            power.generators++;
        }
        power.storedJoules += joules;
    };
    /**
     * Behaviors read by name rather than through a typed constant, because
     * upstream models none of them. Their shapes were read off a real 7.38 save,
     * so every field is treated as possibly absent.
     */
    const readBehaviorStats = (behavior) => {
        const data = behavior.templateData;
        switch (behavior.name) {
            case "EnergyConsumer":
            case "NonEssentialEnergyConsumer":
                power.consumers++;
                break;
            case "BuildingHP":
                buildings.total++;
                // Max hit points vary by building and by the material it is made of
                // (a ladder tops out at 10, a tile at 100), and the save stores only
                // the current value. Bucket by prefab now and calibrate the maximum
                // from the save itself once every building has been seen.
                if (data?.hitpoints != null) {
                    let buckets = hitpointsByPrefab.get(currentPrefab);
                    if (!buckets) {
                        buckets = new Map();
                        hitpointsByPrefab.set(currentPrefab, buckets);
                    }
                    buckets.set(data.hitpoints, (buckets.get(data.hitpoints) ?? 0) + 1);
                }
                break;
            case "BuildingEnabledButton":
                if (data?.buildingEnabled === false) {
                    buildings.disabled++;
                }
                break;
            case "Harvestable":
                plants.total++;
                if (data?.canBeHarvested) {
                    plants.readyToHarvest++;
                }
                break;
        }
    };
    const visit = (prefab, gameObject, stored) => {
        totalObjects++;
        if (stored) {
            storedItems++;
        }
        add(byPrefab, prefab, 1);
        currentPrefab = prefab;
        for (const behavior of gameObject.behaviors) {
            if (behavior.extraRaw) {
                const entry = unmodelled.get(behavior.name) ?? { count: 0, bytes: 0 };
                entry.count++;
                entry.bytes += behavior.extraRaw.byteLength;
                unmodelled.set(behavior.name, entry);
            }
            readBehaviorStats(behavior);
        }
        readPowerStats(gameObject);
        const elementData = (0, utils_1.getBehavior)(gameObject, known_behaviors_1.PrimaryElementBehavior)?.templateData;
        if (elementData && elementData.Units > 0) {
            addElement(byElement, elementName(elementData.ElementID), elementData.Units, elementData._Temperature);
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
    buildings.damaged = countDamagedBuildings(hitpointsByPrefab);
    return {
        totalObjects,
        storedItems,
        byPrefab,
        byElement,
        duplicants,
        geysers,
        achievements,
        power,
        buildings,
        plants,
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
/**
 * Count buildings sitting below the highest hit point value seen for their
 * prefab.
 *
 * Calibrating against the save avoids hardcoding a max-HP table, at the cost of
 * one blind spot: if every instance of a prefab is damaged by the same amount,
 * none of them are counted.
 */
function countDamagedBuildings(hitpointsByPrefab) {
    let damaged = 0;
    for (const buckets of hitpointsByPrefab.values()) {
        const max = Math.max(...buckets.keys());
        for (const [hitpoints, count] of buckets) {
            if (hitpoints < max) {
                damaged += count;
            }
        }
    }
    return damaged;
}
/** Accumulate mass and mass-weighted heat so the mean can be taken at the end. */
function addElement(totals, key, mass, kelvin) {
    const entry = totals.get(key) ?? { mass: 0, heat: 0 };
    entry.mass += mass;
    if (kelvin != null && Number.isFinite(kelvin)) {
        entry.heat += mass * kelvin;
    }
    totals.set(key, entry);
}
const KELVIN_OFFSET = 273.15;
function capElements(totals, top) {
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1].mass - a[1].mass);
    const kept = top > 0 ? sorted.slice(0, top) : sorted;
    const out = {};
    for (const [key, entry] of kept) {
        out[key] = {
            mass: round(entry.mass),
            tempC: round(entry.heat / entry.mass - KELVIN_OFFSET),
        };
    }
    if (kept.length < sorted.length) {
        const rest = sorted.slice(kept.length);
        const mass = rest.reduce((sum, [, e]) => sum + e.mass, 0);
        const heat = rest.reduce((sum, [, e]) => sum + e.heat, 0);
        out[`(${rest.length} more)`] = {
            mass: round(mass),
            tempC: round(heat / mass - KELVIN_OFFSET),
        };
    }
    return out;
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