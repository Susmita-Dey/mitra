import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.blink",
  priority: 0,
  weight: 8,            // Blinks are frequent — high relative weight.
  cooldownMs: 0,        // Handled by custom timer inside canExecute.
  action: "blink",
  canInterrupt: false,
};

let nextBlinkTime = 0;

/**
 * Blink — the most frequent ambient action.
 * Always eligible. High weight ensures it wins the ambient lottery often.
 * Cooldown prevents double-blinks from happening too close together.
 */
export const BlinkBehavior: RegisteredBehavior = {
  definition,
  canExecute: () => {
    return Date.now() >= nextBlinkTime;
  },
  execute: (context: BehaviorContext) => {
    // 15% chance for a double blink
    const isDouble = Math.random() < 0.15;
    
    if (isDouble) {
      context.emit({ type: "PlayAnimation", animation: "double-blink" });
    } else {
      context.emit({ type: "PlayAnimation", animation: "blink" });
    }
    
    // Schedule next blink in 3-8 seconds
    nextBlinkTime = Date.now() + 3000 + (Math.random() * 5000);
  },
};
