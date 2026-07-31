import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.observe",
  priority: 70,         // Reactive bracket — higher than all ambient behaviors.
  weight: 10,           // Always wins its bracket when eligible.
  cooldownMs: 30_000,    // Can repeat, but not too often.
  action: "observe",
  canInterrupt: true,   // Can be interrupted by higher-priority events.
};

/**
 * Observe — Mitra attentively watches the user.
 * Triggered by the "hover" interaction state — when the cursor enters the window.
 * Sits in the reactive bracket (priority 20) so it always pre-empts ambient behaviors.
 * Pushes "curious" to communicate attentive interest without excitement.
 */
export const ObserveBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.character.interaction === "hover";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "observe" });
    context.emit({ type: "ChangeEmotion", emotion: "curious" });
  },
};
