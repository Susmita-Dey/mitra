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
  | "lie-down"
  | "wave"
  | "yawn"
  | "stand"
  | "peek"
  | "sniff"
  | "tail-flick"
  | "ear-twitch"
  | "celebrate"
  | "double-blink";

export const DEFAULT_ANIMATION: Animation = "idle";
