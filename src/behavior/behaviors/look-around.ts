import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.look-around",
  priority: 0,
  weight: 3,
  cooldownMs: 20_000,   // At most once every 20 seconds.
  action: "look-around",
  canInterrupt: false,
};

/**
 * LookAround — Mitra gently glances to the side, as if noticing her environment.
 * Moderate weight and a long cooldown keep this feeling spontaneous, not habitual.
 * Pushes the "curious" emotion for the duration of the animation.
 */
export const LookAroundBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Don't look around if already engaged in a higher state.
    return (
      context.character.animation === "idle" ||
      context.character.animation === "blink"
    );
  },
  execute: (context: BehaviorContext) => {
    context.setAnimation("look-around");
    context.pushEmotion("curious");
  },
};
