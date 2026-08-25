/**
 * A save reduced to something worth reading.
 *
 * A save holds hundreds of thousands of game objects, so a verbatim dump says
 * very little for its size. This resolves hashes back to names, aggregates the
 * long tail into counts, and keeps per-entity detail only where entities are
 * few and individually meaningful (duplicants, geysers).
 */

import { SaveGame } from "../save-structure/save-game";
import { GameObject } from "../save-structure/game-objects/game-object";
import { GameObjectBehavior } from "../save-structure/game-objects/game-object-behavior/game-object-behavior";
import { getBehavior } from "../save-structure/game-objects/game-object-behavior/utils";
import {
  AITraitsBehavior,
  AIAttributeLevelsBehavior,
  GeyserBehavior,
  HealthBehavior,
  MinionIdentityBehavior,
  MinionModifiersBehavior,
  ColonyAchievementTrackerBehavior,
  MinionResumeBehavior,
  PrimaryElementBehavior,
  StorageBehavior,
} from "../save-structure/game-objects/game-object-behavior/known-behaviors";
import { GeyserType } from "../save-structure/const-data/geysers/geyser-type";
import { SimHashes } from "../save-structure/const-data/template-enumerations";
import { getDLCIds, isBaseGameSave } from "../save-structure/const-data/dlc";
import { isVerifiedVersion } from "../save-structure/version-validator";

export interface DigestOptions {
  /** Recorded in the output so a digest can be traced back to its source. */
  file?: string;
  /** Size of the source file in bytes, if known. */
  bytes?: number;
  /**
   * Fold prefab and element counts past this many entries into a single
   * "(N more)" bucket, so a long tail cannot drown out the rest of the
   * document. 0 keeps every entry.
   */
  top?: number;
}

export interface SaveDigest {
  meta: DigestMeta;
  colony: DigestColony;
  world: DigestWorld;
  difficulty?: DigestDifficulty;
  duplicants: DigestDuplicant[];
  geysers: DigestGeyser[];
  achievements?: DigestAchievements;
  research?: DigestResearch;
  power: DigestPower;
  buildings: DigestBuildings;
  plants: DigestPlants;
  objects: DigestObjects;
  materials: DigestMaterials;
  unmodelledBehaviors: DigestUnmodelledBehavior[];
}

export interface DigestResearch {
  completed: number;
  total: number;
  /** Empty when nothing is queued. */
  active?: string;
  queued?: string;
  /** Unspent research points per type. */
  points: Record<string, number>;
  /** Techs not yet complete, which is the shorter and more telling half. */
  pending: string[];
}

export interface DigestPower {
  /** Energy sitting in batteries, transformers and generator buffers. */
  storedJoules: number;
  batteries: number;
  transformers: number;
  generators: number;
  consumers: number;
}

export interface DigestBuildings {
  total: number;
  /** Switched off by hand. A common cause of "why is this not working". */
  disabled: number;
  /**
   * Below the highest hit point value seen for their prefab. Max HP is not in
   * the save and varies by building and material, so it is calibrated from the
   * save itself; a prefab whose every instance is equally damaged reads as
   * undamaged.
   */
  damaged: number;
}

export interface DigestPlants {
  total: number;
  readyToHarvest: number;
}

export interface DigestMeta {
  file?: string;
  bytes?: number;
  buildVersion: number;
  saveVersion: string;
  versionVerified: boolean;
  baseGame: boolean;
  dlcIds: string[];
  compressed: boolean;
}

export interface DigestColony {
  name: string;
  originalSaveName: string;
  cycles: number;
  duplicantCount: number;
  sandboxEnabled: boolean;
  autoSave: boolean;
  colonyGuid: string;
  clusterId: string;
}

export interface DigestWorld {
  widthInCells: number;
  heightInCells: number;
  discoveredSurface?: boolean;
}

export interface DigestDifficulty {
  isCustomGame: boolean;
  customGameMode: number;
  levels: Record<string, unknown>;
}

export interface DigestDuplicant {
  name?: string;
  gender?: string;
  arrivalCycle?: number;
  cell: DigestCell;
  traits: string[];
  role?: string;
  targetRole?: string;
  totalExperience?: number;
  skills: string[];
  attributes?: Record<string, number>;
  /** Live meters: Stress, Calories, Stamina, Bladder, Breath, HitPoints, ... */
  amounts?: Record<string, number>;
  sicknesses?: string[];
  canBeIncapacitated?: boolean;
}

export interface DigestGeyser {
  prefab: string;
  type?: string;
  cell: DigestCell;
  /**
   * Klei stores geyser output as rolls in 0..1, resolved against per-type
   * ranges at runtime. Those ranges are not in the save, so the rolls cannot be
   * turned into g/s or cycle timings here and are reported as-is.
   */
  rolls?: {
    rate?: number;
    iterationLength?: number;
    iterationPercent?: number;
    yearLength?: number;
    yearPercent?: number;
  };
}

export interface DigestAchievements {
  earned: string[];
  /** Marked failed by the game; a "do not do X" condition that was broken. */
  failed: string[];
  pending: number;
}

export interface DigestObjects {
  groups: number;
  total: number;
  stored: number;
  byPrefab: Record<string, number>;
}

export interface DigestMaterials {
  note: string;
  byElement: Record<string, DigestElement>;
}

export interface DigestElement {
  /** Total units across every game object made of, or holding, this element. */
  mass: number;
  /**
   * Mass-weighted mean temperature in Celsius. The save stores Kelvin; Celsius
   * is what the game shows and what the material's phase transitions are
   * usually quoted in.
   */
  tempC: number;
}

export interface DigestUnmodelledBehavior {
  behavior: string;
  count: number;
  bytes: number;
}

export interface DigestCell {
  x: number;
  y: number;
}

export function buildSaveDigest(
  save: SaveGame,
  options: DigestOptions = {},
): SaveDigest {
  const info = save.header.gameInfo;
  const top = options.top ?? 0;
  const collected = collectObjects(save);

  return {
    meta: {
      file: options.file,
      bytes: options.bytes,
      buildVersion: save.header.buildVersion,
      saveVersion: `${info.saveMajorVersion}.${info.saveMinorVersion}`,
      versionVerified: isVerifiedVersion(
        info.saveMajorVersion,
        info.saveMinorVersion,
      ),
      baseGame: isBaseGameSave(info),
      dlcIds: getDLCIds(info),
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
      note:
        "Element totals across game objects (buildings, debris, stored items). " +
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
function buildResearch(save: SaveGame): DigestResearch | undefined {
  const research: any = findGlobalBehavior(save, "Research")?.templateData;
  const techs: any[] = research?.saveData?.techs;
  if (!techs) {
    return undefined;
  }

  const points: Record<string, number> = {};
  for (const entry of research.globalPointInventory?.PointsByTypeID ?? []) {
    const [type, amount] = entry as [string, number];
    points[type] = round(amount)!;
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
function findGlobalBehavior(save: SaveGame, name: string) {
  const group = save.gameObjects.find((g) => g.name === "SaveGame");
  return group?.gameObjects[0]?.behaviors.find((b) => b.name === name);
}

function buildDifficulty(save: SaveGame): DigestDifficulty | undefined {
  const settings = save.gameData?.customGameSettings;
  if (!settings) {
    return undefined;
  }
  const levels: Record<string, unknown> = {};
  for (const entry of settings.CurrentQualityLevelsBySetting ?? []) {
    const [key, value] = entry as [string, unknown];
    levels[key] = value;
  }
  return {
    isCustomGame: settings.is_custom_game,
    customGameMode: settings.customGameMode,
    levels,
  };
}

interface ElementTotals {
  mass: number;
  /** Sum of mass * Kelvin, divided out at the end for a mass-weighted mean. */
  heat: number;
}

interface CollectedObjects {
  totalObjects: number;
  storedItems: number;
  byPrefab: Map<string, number>;
  byElement: Map<string, ElementTotals>;
  duplicants: DigestDuplicant[];
  geysers: DigestGeyser[];
  unmodelled: DigestUnmodelledBehavior[];
  achievements?: DigestAchievements;
  power: DigestPower;
  buildings: DigestBuildings;
  plants: DigestPlants;
}

function collectObjects(save: SaveGame): CollectedObjects {
  const byPrefab = new Map<string, number>();
  const byElement = new Map<string, ElementTotals>();
  const unmodelled = new Map<string, { count: number; bytes: number }>();
  const duplicants: DigestDuplicant[] = [];
  const geysers: DigestGeyser[] = [];
  let achievements: DigestAchievements | undefined;
  let totalObjects = 0;
  let storedItems = 0;

  const power: DigestPower = {
    storedJoules: 0,
    batteries: 0,
    transformers: 0,
    generators: 0,
    consumers: 0,
  };
  const buildings: DigestBuildings = { total: 0, disabled: 0, damaged: 0 };
  const plants: DigestPlants = { total: 0, readyToHarvest: 0 };

  /** prefab -> hit point value -> how many buildings sit at that value. */
  const hitpointsByPrefab = new Map<string, Map<number, number>>();
  let currentPrefab = "";

  /**
   * Behaviors read by name rather than through a typed constant, because
   * upstream models none of them. Their shapes were read off a real 7.38 save,
   * so every field is treated as possibly absent.
   */
  const readBehaviorStats = (behavior: GameObjectBehavior) => {
    const data: any = behavior.templateData;
    switch (behavior.name) {
      case "Battery":
      case "BatterySmart":
        power.batteries++;
        power.storedJoules += data?.joulesAvailable ?? 0;
        break;
      case "PowerTransformer":
        power.transformers++;
        power.storedJoules += data?.joulesAvailable ?? 0;
        break;
      case "EnergyGenerator":
        power.generators++;
        power.storedJoules += data?.joulesAvailable ?? 0;
        break;
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

  const visit = (prefab: string, gameObject: GameObject, stored: boolean) => {
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

    const elementData = getBehavior(
      gameObject,
      PrimaryElementBehavior,
    )?.templateData;
    if (elementData && elementData.Units > 0) {
      addElement(
        byElement,
        elementName(elementData.ElementID),
        elementData.Units,
        elementData._Temperature,
      );
    }

    if (prefab === "Minion") {
      duplicants.push(describeDuplicant(gameObject));
    }

    const tracker = getBehavior(gameObject, ColonyAchievementTrackerBehavior);
    if (tracker?.extraData) {
      achievements = {
        earned: tracker.extraData.filter((a) => a.success).map((a) => a.id),
        failed: tracker.extraData.filter((a) => a.failed).map((a) => a.id),
        pending: tracker.extraData.filter((a) => !a.success && !a.failed)
          .length,
      };
    }

    const geyser = getBehavior(gameObject, GeyserBehavior);
    if (geyser) {
      geysers.push(describeGeyser(prefab, gameObject, geyser));
    }

    // Stored items are game objects in their own right, and hold the bulk of a
    // colony's resources. Walk into them rather than counting the container.
    const storage = getBehavior(gameObject, StorageBehavior);
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

function describeDuplicant(gameObject: GameObject): DigestDuplicant {
  const identity = getBehavior(
    gameObject,
    MinionIdentityBehavior,
  )?.templateData;
  const traits = getBehavior(gameObject, AITraitsBehavior)?.templateData;
  const resume = getBehavior(gameObject, MinionResumeBehavior)?.templateData;
  const attributes = getBehavior(
    gameObject,
    AIAttributeLevelsBehavior,
  )?.templateData;
  const health = getBehavior(gameObject, HealthBehavior)?.templateData;

  return {
    name: identity?.name,
    gender: identity?.gender,
    arrivalCycle: identity?.arrivalTime,
    cell: cellOf(gameObject),
    traits: (traits?.TraitIds ?? []).filter((id: string) => id !== "None"),
    role: roleName(resume?.currentRole),
    targetRole: roleName(resume?.targetRole),
    totalExperience: round(resume?.totalExperienceGained),
    skills: masteredNames(resume?.MasteryBySkillID),
    attributes: attributeLevels(attributes?.saveLoadLevels),
    ...describeModifiers(gameObject),
    canBeIncapacitated: health?.canBeIncapacitated,
  };
}

function describeModifiers(
  gameObject: GameObject,
): Pick<DigestDuplicant, "amounts" | "sicknesses"> {
  const modifiers = getBehavior(gameObject, MinionModifiersBehavior)?.extraData;
  if (!modifiers) {
    return {};
  }
  const amounts: Record<string, number> = {};
  for (const amount of modifiers.amounts ?? []) {
    const value = round(amount.value?.value);
    if (value != null) {
      amounts[amount.name] = value;
    }
  }
  const sicknesses = (modifiers.sicknesses ?? [])
    .map((sickness) => sickness.value?.diseaseId)
    .filter((id): id is string => Boolean(id));

  return {
    amounts: Object.keys(amounts).length > 0 ? amounts : undefined,
    sicknesses: sicknesses.length > 0 ? sicknesses : undefined,
  };
}

function describeGeyser(
  prefab: string,
  gameObject: GameObject,
  geyser: GeyserBehavior,
): DigestGeyser {
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

function add(counts: Map<string, number>, key: string, amount: number) {
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
function countDamagedBuildings(
  hitpointsByPrefab: Map<string, Map<number, number>>,
): number {
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
function addElement(
  totals: Map<string, ElementTotals>,
  key: string,
  mass: number,
  kelvin: number | undefined,
) {
  const entry = totals.get(key) ?? { mass: 0, heat: 0 };
  entry.mass += mass;
  if (kelvin != null && Number.isFinite(kelvin)) {
    entry.heat += mass * kelvin;
  }
  totals.set(key, entry);
}

const KELVIN_OFFSET = 273.15;

function capElements(
  totals: Map<string, ElementTotals>,
  top: number,
): Record<string, DigestElement> {
  const sorted = Array.from(totals.entries()).sort(
    (a, b) => b[1].mass - a[1].mass,
  );
  const kept = top > 0 ? sorted.slice(0, top) : sorted;
  const out: Record<string, DigestElement> = {};
  for (const [key, entry] of kept) {
    out[key] = {
      mass: round(entry.mass)!,
      tempC: round(entry.heat / entry.mass - KELVIN_OFFSET)!,
    };
  }
  if (kept.length < sorted.length) {
    const rest = sorted.slice(kept.length);
    const mass = rest.reduce((sum, [, e]) => sum + e.mass, 0);
    const heat = rest.reduce((sum, [, e]) => sum + e.heat, 0);
    out[`(${rest.length} more)`] = {
      mass: round(mass)!,
      tempC: round(heat / mass - KELVIN_OFFSET)!,
    };
  }
  return out;
}

function capCounts(
  counts: Map<string, number>,
  top: number,
): Record<string, number> {
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const kept = top > 0 ? sorted.slice(0, top) : sorted;
  const out: Record<string, number> = {};
  for (const [key, count] of kept) {
    out[key] = round(count)!;
  }
  if (kept.length < sorted.length) {
    const rest = sorted.slice(kept.length);
    out[`(${rest.length} more)`] = round(
      rest.reduce((sum, [, count]) => sum + count, 0),
    )!;
  }
  return out;
}

function cellOf(gameObject: GameObject): DigestCell {
  return {
    x: Math.floor(gameObject.position.x),
    y: Math.floor(gameObject.position.y),
  };
}

function masteredNames(mastery: [string, boolean][] | undefined): string[] {
  return (mastery ?? []).filter(([, earned]) => earned).map(([id]) => id);
}

function attributeLevels(
  levels: { attributeId: string; level: number }[] | undefined,
): Record<string, number> | undefined {
  if (!levels?.length) {
    return undefined;
  }
  const out: Record<string, number> = {};
  for (const { attributeId, level } of levels) {
    out[attributeId] = level;
  }
  return out;
}

function elementName(id: unknown): string {
  const name = typeof id === "number" ? SimHashes[id] : undefined;
  return name ?? `unknown(${String(id)})`;
}

function geyserTypeName(typeId: { hash: number } | undefined): string {
  if (typeId?.hash == null) {
    return "unknown";
  }
  return (GeyserType as any)[typeId.hash] ?? `unknown(${typeId.hash})`;
}

/** ONI stores "NoRole" rather than an empty string when nothing is assigned. */
function roleName(role: string | undefined): string | undefined {
  return !role || role === "NoRole" ? undefined : role;
}

function round(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return value;
  }
  return Math.round(value * 1000) / 1000;
}
