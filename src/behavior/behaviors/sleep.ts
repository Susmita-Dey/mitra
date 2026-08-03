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
  priority: 40,          // Highest ambient presence state (overrides yawn and lie-down)
  weight: 10,
  cooldownMs: 0,
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
    // Run if presence dictates sleep or if already expressing sleepiness.
    return context.world.presence === "Sleep" || context.world.character.emotion === "sleepy";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sleep" });
    context.emit({ type: "ChangePhysical", state: { behavior: "sleeping", energy: "sleepy" } });
    // Re-push sleepy to keep the EmotionEngine's sticky state confirmed.
    context.emit({ type: "ChangeEmotion", emotion: "sleepy" });
    context.setMemory({ wasAsleep: true });
  },
};
