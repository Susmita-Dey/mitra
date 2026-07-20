/**
 * Movement intents emitted by Behaviors.
 *
 * Behaviors do not move the window directly. They emit an intent to the Brain,
 * which decides if the movement is permitted based on the current state.
 */
export type MovementIntent =
  | { type: "move-to"; x: number; y: number; animate?: boolean }
  | { type: "snap-to-edge" }
  | { type: "follow-cursor" }
  | { type: "wander" }
  | { type: "return-home" }
  | { type: "drag" };
