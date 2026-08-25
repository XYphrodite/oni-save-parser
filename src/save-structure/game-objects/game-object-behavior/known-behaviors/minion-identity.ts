import { AccessoryType } from "../../../const-data";
import { HashedString } from "../../../data-types";

import { GameObjectBehavior } from "../game-object-behavior";

import { BehaviorName } from "./types";

export const MinionIdentityBehavior: BehaviorName<MinionIdentityBehavior> =
  "MinionIdentity";
export interface MinionIdentityBehavior extends GameObjectBehavior {
  name: "MinionIdentity";
  templateData: {
    name: string;
    nameStringKey: string;

    gender: MinionGender;
    genderStringKey: MinionGender;

    /** Cycle the duplicant joined the colony, not a timestamp. */
    arrivalTime: number;

    voiceIdx: number;

    /**
     * Dropped from the save; appearance now lives on the Accessorizer and
     * WearableAccessorizer behaviors. Kept optional for older saves.
     */
    bodyData?: BodyData;

    model?: { name: string; hash: number };
    stickerType?: string;
    personalityResourceId?: { hash: number };

    assignableProxy: {
      id: number;
    };
  };
}

export interface BodyData {
  headShape: HashedString;
  mouth: HashedString;
  neck: HashedString;
  eyes: HashedString;
  hair: HashedString;
  body: HashedString;
  arms: HashedString;
  hat: HashedString;
}

export type MinionGender = "MALE" | "FEMALE" | "NB";

export const MINION_IDENTITY_GENDERS: MinionGender[] = ["MALE", "FEMALE", "NB"];

export const MINION_IDENTITY_VOICES: number[] = [0, 1, 2, 3, 4];

export const MINION_IDENTITY_BODY_DATA_ACCESSORIES: Record<
  keyof BodyData,
  AccessoryType
> = {
  headShape: "headshape",
  mouth: "mouth",
  neck: "neck",
  eyes: "eyes",
  hair: "hair",
  body: "body",
  arms: "arm",
  hat: "hat"
};
