import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.taskbar",
  priority: 10,
  weight: 2,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

/**
 * Taskbar — Default state, returning home to the taskbar.
 */
export const TaskbarBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "Taskbar";
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "idle") {
      context.emit({ type: "PlayAnimation", animation: "idle" });
      context.emit({ type: "ChangeEmotion", emotion: "neutral" });
    }
    // Also instruct to return home
    context.emit({ type: "MoveToTaskbar" });
  },
};
