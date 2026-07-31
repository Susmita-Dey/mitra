/** Visual motion the companion body is performing. Independent from emotion. */
export type Animation =
  | "idle"
  | "blink"
  | "look-around"
  | "stretch"
  | "sleep"
  | "walk"
  | "observe"
  | "sit"
  | "wave"
  | "yawn"
  | "stand";

export const DEFAULT_ANIMATION: Animation = "idle";
