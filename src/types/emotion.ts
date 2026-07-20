/** Internal mood expressed through future expressions. Independent from animation. */
export type Emotion =
  | "neutral"
  | "relaxed"
  | "waiting"
  | "curious"
  | "happy"
  | "concerned"
  | "sleepy"
  | "focused";

export const DEFAULT_EMOTION: Emotion = "neutral";
