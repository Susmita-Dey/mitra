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
    const enteringTaskbar =
      context.world.character.animation !== "idle";

    if (!enteringTaskbar) {
      return;
    }

    context.emit({
      type: "PlayAnimation",
      animation: "idle",
    });

    context.emit({
      type: "ChangeEmotion",
      emotion: "neutral",
    });

    // Only move ONCE when transitioning
    context.emit({
      type: "MoveToTaskbar",
    });
  }
};
