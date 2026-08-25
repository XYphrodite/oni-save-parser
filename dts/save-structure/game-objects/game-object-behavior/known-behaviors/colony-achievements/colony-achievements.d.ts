import { GameObjectBehavior } from "../../game-object-behavior";
import { BehaviorName } from "../types";
export declare const ColonyAchievementTrackerBehavior: BehaviorName<ColonyAchievementTrackerBehavior>;
export interface ColonyAchievementTrackerBehavior extends GameObjectBehavior {
    name: "ColonyAchievementTracker";
    templateData: {};
    extraData: ColonyAchievementStatus[];
}
/**
 * One entry of ColonyAchievementTracker's achievements dictionary.
 *
 * `success` and `failed` are independent: an achievement with a "do not do X"
 * condition can be marked failed without ever having succeeded.
 */
export interface ColonyAchievementStatus {
    id: string;
    success: boolean;
    failed: boolean;
}
