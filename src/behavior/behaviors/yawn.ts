import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.yawn",
  priority: 35,          // Between lie-down (30) and sleep (40)
  weight: 5,
  cooldownMs: 0,
  action: "yawn",
  canInterrupt: false,
};

/**
 * Yawn — Mitra yawns when she's sleepy but not yet asleep.
 * Pre-empts idle behaviors when the emotion is "sleepy".
 */
export const YawnBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "Yawning";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "yawn" });
    context.emit({ type: "ChangeEmotion", emotion: "sleepy" });
    context.emit({ type: "PlaySound", category: "sleepy" });
  },
};
