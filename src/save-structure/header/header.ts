import { Schema } from "jsonschema";

export interface SaveGameHeader {
  buildVersion: number;
  headerVersion: number;
  isCompressed: boolean;
  gameInfo: SaveGameInfo;
}

/**
 * Class: "SaveGame+GameInfo"
 * Parser: "SaveGame.GetGameInfo(byte[] bytes)"
 */
export interface SaveGameInfo {
  numberOfCycles: number;
  numberOfDuplicants: number;
  baseName: string;
  isAutoSave: boolean;
  originalSaveName: string;
  saveMajorVersion: number;
  saveMinorVersion: number;
  clusterId: string;
  //worldTraits: null; // Not sure what this is
  sandboxEnabled: boolean;
  colonyGuid: string;
  /** Empty string on the base game. "EXPANSION1_ID" for Spaced Out!. */
  dlcId: string;
  /**
   * Present on newer builds, which allow several content packs at once.
   * Empty or absent on the base game.
   */
  dlcIds?: string[];
}

export const headerSchema: Schema = {
  type: "object",
  properties: {
    buildVersion: {
      type: "number",
    },
    headerVersion: {
      type: "number",
    },
    isCompressed: {
      type: "boolean",
    },
    gameInfo: {
      type: "object",
    },
  },
  additionalProperties: false,
};
