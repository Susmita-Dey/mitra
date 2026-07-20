import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.idle",
  priority: 0,
  weight: 5,
  cooldownMs: 0,        // No cooldown — idle is always a valid fallback.
  action: "idle",
  canInterrupt: false,
};

/**
 * Idle — the baseline ambient behavior.
 * Priority 0, always eligible. Sets the companion to a calm neutral resting pose.
 * Other ambient behaviors compete against idle probabilistically.
 */
export const IdleBehavior: RegisteredBehavior = {
  definition,
  canExecute: () => true,
  execute: (context: BehaviorContext) => {
    context.setAnimation("idle");
    context.pushEmotion("neutral");
  },
};
