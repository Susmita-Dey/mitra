import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.wander",
  priority: 50,
  weight: 4,
  cooldownMs: 0,
  action: "walk",
  canInterrupt: true,
};

/**
 * Wander — Mitra wanders aimlessly around the screen.
 */
export const WanderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "Wander" && context.world.settings.behavior.wanderEnabled;
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "walk") {
      context.emit({ type: "PlayAnimation", animation: "walk" });
      context.emit({ type: "ChangeEmotion", emotion: "happy" });
      // Tell window to move around, handled by some generic wandering logic if we had MoveRandomly
      // For now we'll just MoveToHome as a proxy or do nothing and let the renderer handle walk
      // In the future we should emit a specific movement intent for wander
    }
  },
};
