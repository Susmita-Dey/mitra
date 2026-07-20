import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.walk",
  priority: 0,
  weight: 2,
  cooldownMs: 45_000,   // At most once every 45 seconds.
  action: "walk",
  canInterrupt: false,
};

/**
 * Walk — Mitra takes a few short steps in one direction and returns.
 * Rare and whimsical. The actual position change is handled by the Renderer
 * reading the "walk" animation from character.json — this behavior only
 * signals the action.
 */
export const WalkBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Only walk from a resting state.
    return (
      context.character.animation === "idle" &&
      context.character.emotion !== "sleepy" &&
      context.character.emotion !== "focused"
    );
  },
  execute: (context: BehaviorContext) => {
    context.setAnimation("walk");
    context.pushEmotion("relaxed");
  },
};
