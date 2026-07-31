import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.follow-cursor",
  priority: 70,
  weight: 8,
  cooldownMs: 45_000,
  action: "walk",
  canInterrupt: true,
};

/**
 * Follow Cursor — Mitra briefly follows the mouse cursor.
 */
export const FollowCursorBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "FollowCursor";
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "walk") {
      context.emit({ type: "PlayAnimation", animation: "walk" });
      context.emit({ type: "ChangeEmotion", emotion: "curious" });
    }
    // Also instruct window to move to cursor
    context.emit({ type: "MoveToCursor" });
  },
};
