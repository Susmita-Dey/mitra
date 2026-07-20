import type { Behavior, BehaviorContext } from "./behavior";

/**
 * The ultimate fallback behavior.
 *
 * Priority 0 — always eligible to run when no higher-priority behavior is active.
 * Uses pushEmotion so the EmotionEngine can reject the push if a sticky emotion
 * (sleepy, focused) is currently locked in. The animation is set directly because
 * animation state does not flow through the EmotionEngine.
 */
export const IdleBehavior: Behavior = {
  id: "core.idle",
  priority: 0,
  canExecute: () => true,
  execute: (context: BehaviorContext) => {
    if (context.character.animation !== "idle") {
      context.setAnimation("idle");
    }
    // pushEmotion will silently fail (return false) if a sticky emotion is active.
    // That is the correct behavior — idle should never override focused or sleepy.
    context.pushEmotion("neutral");
  },
};

