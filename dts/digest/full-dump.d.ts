import { SaveGame } from "../save-structure/save-game";
export interface FullDumpOptions {
    /**
     * Include the simulation blob as base64. It is megabytes of opaque data this
     * parser never interprets, so it is omitted by default.
     */
    includeSim?: boolean;
}
/**
 * The whole parsed model, with binary values replaced by
 * `{ $binary: "<base64>", length }` so the result survives JSON.stringify.
 */
export declare function buildFullDump(save: SaveGame, options?: FullDumpOptions): unknown;
export declare function encodeBinaries(value: unknown): unknown;
