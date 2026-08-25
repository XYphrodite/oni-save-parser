import { GameObjectBehavior } from "../game-object-behavior";
import { BehaviorName } from "./types";
export declare const HealthBehavior: BehaviorName<HealthBehavior>;
export interface HealthBehavior extends GameObjectBehavior {
    name: "Health";
    templateData: {
        canBeIncapacitated: boolean;
    };
}
