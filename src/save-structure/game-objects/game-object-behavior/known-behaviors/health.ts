import { GameObjectBehavior } from "../game-object-behavior";
import { BehaviorName } from "./types";

export const HealthBehavior: BehaviorName<HealthBehavior> = "Health";
export interface HealthBehavior extends GameObjectBehavior {
  name: "Health";
  templateData: {
    canBeIncapacitated: boolean;
  };
}
