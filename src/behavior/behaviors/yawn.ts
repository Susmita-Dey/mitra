import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.yawn",
  priority: 4,          // Just below sleep (5)
  weight: 5,
  cooldownMs: 45_000,
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
    return context.character.emotion === "sleepy" && context.character.animation !== "sleep";
  },
  execute: (context: BehaviorContext) => {
    context.setAnimation("yawn");
    context.pushEmotion("sleepy");
  },
};
