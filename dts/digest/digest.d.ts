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
    objects: DigestObjects;
    materials: DigestMaterials;
    unmodelledBehaviors: DigestUnmodelledBehavior[];
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
    byElement: Record<string, number>;
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
