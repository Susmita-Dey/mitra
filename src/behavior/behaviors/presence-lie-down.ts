import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.lie-down",
  priority: 30,
  weight: 5,
  cooldownMs: 0,
  action: "lie-down",
  canInterrupt: true,
};

/**
 * Lie Down — Mitra lies down when the user is very idle.
 */
export const LieDownBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "LyingDown";
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "lie-down") {
      context.emit({ type: "PlayAnimation", animation: "lie-down" });
      context.emit({ type: "ChangeEmotion", emotion: "sleepy" });
    }
  },
};
