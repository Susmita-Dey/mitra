import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.blink",
  priority: 0,
  weight: 8,            // Blinks are frequent — high relative weight.
  cooldownMs: 3_000,    // Min 3 seconds between blinks (random interval on top via weight).
  action: "blink",
  canInterrupt: false,
};

/**
 * Blink — the most frequent ambient action.
 * Always eligible. High weight ensures it wins the ambient lottery often.
 * Cooldown prevents double-blinks from happening too close together.
 */
export const BlinkBehavior: RegisteredBehavior = {
  definition,
  canExecute: () => true,
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "blink" });
    // Blink does not change emotion — it is purely physical.
  },
};
