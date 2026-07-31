import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.peek",
  priority: 18,
  weight: 5,
  cooldownMs: 0,
  action: "peek",
  canInterrupt: true,
};

/**
 * Peek — Mitra peeks from the screen edges.
 */
export const PeekBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "Peek";
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "peek") {
      context.emit({ type: "PlayAnimation", animation: "peek" });
      context.emit({ type: "ChangeEmotion", emotion: "curious" });
      context.emit({ type: "SnapToEdge" });
    }
  },
};
