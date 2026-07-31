import type { Emotion, Animation, Interaction } from "./index";

/**
 * Intents represent semantic actions emitted by the Brain.
 * They are queued and then processed by Executors (Renderer, Window, Audio, etc).
 */
export type Intent =
  // ── Character Intents ──────────────────────────────────────────────────
  | { type: "ChangeEmotion"; emotion: Emotion }
  | { type: "PlayAnimation"; animation: Animation }
  | { type: "SetInteraction"; interaction: Interaction }
  | { type: "Greet" }
  | { type: "Celebrate" }
  | { type: "Sleep" }
  | { type: "Wake" }
  | { type: "Stretch" }
  | { type: "Yawn" }
  | { type: "AcknowledgeReminder"; reminderId: string }
  | { type: "LookAround" }
  | { type: "Observe" }
  
  // ── Window Intents ─────────────────────────────────────────────────────
  | { type: "MoveToHome" }
  | { type: "MoveToTaskbar" }
  | { type: "MoveToCursor" }
  | { type: "MoveToCenter" }
  | { type: "SnapToEdge" }
  | { type: "HideWindow" }
  | { type: "ShowWindow" }
  
  // ── Audio Intents ──────────────────────────────────────────────────────
  | { type: "PlaySound"; category: "greet" | "happy" | "sad" | "sleepy" | "curious" | "bored" | "alert" | "drink" | "chirps" | "yawns" | "stretch" | "celebration" | "footsteps" | "idle"; emotion?: Emotion };
