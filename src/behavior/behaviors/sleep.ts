import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

/**
 * How long the user must have been in the "sleepy" emotion before Sleep
 * becomes eligible. The EmotionEngine handles the detection; this behavior
 * simply checks that the resolved emotion is already sleepy.
 *
 * In Phase 3, IdleDetection will push the "sleepy" emotion when the user
 * has been away. This behavior picks that signal up and performs the animation.
 */
const definition: BehaviorDefinition = {
  id: "ambient.sleep",
  priority: 5,          // Higher bracket than ambient (0). Sleepy pre-empts idle actions.
  weight: 10,           // Once eligible, always wins its bracket.
  cooldownMs: 30_000,   // Don't fall asleep and immediately wake every 30s.
  action: "sleep",
  canInterrupt: true,   // User interaction should be able to wake Mitra.
};

/**
 * Sleep — Mitra dozes off when the sleepy emotion is active.
 * Requires the EmotionEngine to have already resolved "sleepy" as the
 * current emotion. The Brain sets this behavior up correctly: emotion is
 * committed AFTER behaviors execute, so we read the previous tick's value.
 */
export const SleepBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Only run if the companion is already expressing sleepiness.
    return context.character.emotion === "sleepy";
  },
  execute: (context: BehaviorContext) => {
    context.setAnimation("sleep");
    // Re-push sleepy to keep the EmotionEngine's sticky state confirmed.
    context.pushEmotion("sleepy");
  },
};
