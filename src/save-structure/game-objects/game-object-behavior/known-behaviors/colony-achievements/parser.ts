import { validateDotNetIdentifierName } from "../../../../../utils";

import {
  ParseIterator,
  UnparseIterator,
  readByte,
  readInt32,
  readKleiString,
  writeByte,
  writeInt32,
  writeKleiString,
} from "../../../../../parser";

import { ColonyAchievementStatus } from "./colony-achievements";

export function* parseColonyAchievementsExtraData(): ParseIterator<
  ColonyAchievementStatus[]
> {
  const count: number = yield readInt32();
  const achievements = new Array<ColonyAchievementStatus>(count);
  for (let i = 0; i < count; i++) {
    const id = yield readKleiString();
    validateDotNetIdentifierName(id);
    const success: number = yield readByte();
    const failed: number = yield readByte();
    achievements[i] = {
      id,
      success: Boolean(success),
      failed: Boolean(failed),
    };
  }
  return achievements;
}

export function* unparseColonyAchievementsExtraData(
  achievements: ColonyAchievementStatus[]
): UnparseIterator {
  yield writeInt32(achievements.length);
  for (const { id, success, failed } of achievements) {
    yield writeKleiString(id);
    yield writeByte(success ? 1 : 0);
    yield writeByte(failed ? 1 : 0);
  }
}
