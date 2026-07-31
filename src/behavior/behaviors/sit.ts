import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.sit",
  priority: 1, // Just above idle
  weight: 3,
  cooldownMs: 30_000,
  action: "sit",
  canInterrupt: false,
};

/**
 * Sit — Mitra occasionally sits down when idling.
 */
export const SitBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Only sit if currently idle and has been idle for a short time
    return (
      context.world.character.animation === "idle" &&
      context.world.environment.idleMs > 5_000
    );
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sit" });
  },
};
