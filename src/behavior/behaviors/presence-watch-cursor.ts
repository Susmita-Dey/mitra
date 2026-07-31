import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.watch-cursor",
  priority: 16,
  weight: 6,
  cooldownMs: 0,
  action: "observe", // Reuse observe animation
  canInterrupt: true,
};

/**
 * Watch Cursor — Mitra watches the cursor while the user is actively moving it.
 */
export const WatchCursorBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "WatchCursor";
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "observe") {
      context.emit({ type: "PlayAnimation", animation: "observe" });
      context.emit({ type: "ChangeEmotion", emotion: "focused" });
    }
  },
};
