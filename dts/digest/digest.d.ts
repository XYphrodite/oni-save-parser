/**
 * A save reduced to something worth reading.
 *
 * A save holds hundreds of thousands of game objects, so a verbatim dump says
 * very little for its size. This resolves hashes back to names, aggregates the
 * long tail into counts, and keeps per-entity detail only where entities are
 * few and individually meaningful (duplicants, geysers).
 */
import { SaveGame } from "../save-structure/save-game";
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
    /** Transformers are counted separately, though they hold a buffer of their own. */
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
export declare function buildSaveDigest(save: SaveGame, options?: DigestOptions): SaveDigest;
