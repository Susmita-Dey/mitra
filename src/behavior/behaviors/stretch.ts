import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.stretch",
  priority: 0,
  weight: 2,
  cooldownMs: 60_000,   // At most once per minute — stretching feels earned.
  action: "stretch",
  canInterrupt: false,
};

/**
 * Stretch — Mitra stretches her arms and yawns.
 * Low weight and long cooldown make this a rare, charming moment.
 * Reinforces the "relaxed" emotion — Mitra is comfortable.
 */
export const StretchBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Only stretch when calm — not when already moving.
    return (
      context.world.character.animation === "idle" &&
      context.world.character.emotion !== "focused" &&
      context.world.character.emotion !== "concerned" &&
      context.world.environment.idleMs > 180_000 // Only stretch after 15s of idle time
    );
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "stretch" });
    context.emit({ type: "PlaySound", category: "sleepy" });
    context.emit({ type: "ChangeEmotion", emotion: "relaxed" });
  },
};
