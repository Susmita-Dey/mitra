import type { Animation } from "./animation";
import { DEFAULT_ANIMATION } from "./animation";
import type { Emotion } from "./emotion";
import { DEFAULT_EMOTION } from "./emotion";
import type { Interaction } from "./interaction";
import { DEFAULT_INTERACTION } from "./interaction";
import type { Position } from "./position";
import { DEFAULT_POSITION } from "./position";

/**
 * Aggregate companion state. Each axis is independent so animation, mood,
 * placement, and input can change without entangling concerns.
 */
export interface Character {
  position: Position;
  animation: Animation;
  emotion: Emotion;
  interaction: Interaction;
}

export function createCharacter(overrides?: Partial<Character>): Character {
  return {
    position: overrides?.position ?? DEFAULT_POSITION,
    animation: overrides?.animation ?? DEFAULT_ANIMATION,
    emotion: overrides?.emotion ?? DEFAULT_EMOTION,
    interaction: overrides?.interaction ?? DEFAULT_INTERACTION,
  };
}
