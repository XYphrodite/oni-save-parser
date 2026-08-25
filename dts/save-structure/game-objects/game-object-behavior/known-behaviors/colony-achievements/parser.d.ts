import { ParseIterator, UnparseIterator } from "../../../../../parser";
import { ColonyAchievementStatus } from "./colony-achievements";
export declare function parseColonyAchievementsExtraData(): ParseIterator<ColonyAchievementStatus[]>;
export declare function unparseColonyAchievementsExtraData(achievements: ColonyAchievementStatus[]): UnparseIterator;
