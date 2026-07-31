import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.look-at-cursor",
  priority: 70,         // Below observe (20), but above ambient
  weight: 8,
  cooldownMs: 3000,
  action: "look-around",
  canInterrupt: true,
};

/**
 * LookAtCursor — Mitra tracks the mouse cursor when the user is moving it nearby.
 */
export const LookAtCursorBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Trigger if mouse is active and in window
    return context.world.environment.mouseActive && context.world.environment.cursorInWindow;
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "observe" }); // Or a specific look-at-cursor animation
    context.emit({ type: "ChangeEmotion", emotion: "curious" });
  },
};
