import type { Emotion } from "@/types";

/**
 * Static definition for a single emotional state.
 *
 * These values never change at runtime — they are constants that describe the
 * rules of each emotion. The EmotionEngine reads these when evaluating a push.
 */
export interface EmotionDefinition {
  /** The emotion this definition describes. */
  id: Emotion;

  /**
   * How strongly this emotion resists being replaced.
   * Higher = harder to interrupt.
   * A new emotion can only replace the current one if either:
   *   (a) the current emotion is interruptible, OR
   *   (b) the incoming emotion has strictly higher priority.
   */
  priority: number;

  /**
   * How long this emotion persists before automatically decaying back to neutral.
   * null means the emotion is sticky — it does not decay on its own.
   * Sticky emotions must be explicitly cleared via EmotionEngine.clear().
   */
  decayMs: number | null;

  /**
   * Whether a lower-or-equal priority emotion is allowed to replace this one.
   * false = this emotion "locks in" and can only be overridden by a higher-priority push.
   */
  interruptible: boolean;

  /**
   * Which emotions are valid predecessors for entering this state.
   * "any" = no restriction.
   * A named array = only those states may transition here.
   * This prevents jarring jumps (e.g., jumping directly from "focused" to "happy").
   */
  allowedFrom: ReadonlyArray<Emotion> | "any";
}

/**
 * The canonical emotional state registry.
 *
 * Priority scale:
 *   0 — Neutral    (baseline, always replaceable)
 *   1 — Relaxed    (gentle positive state, low resistance)
 *   2 — Waiting    (passive anticipation, decays if nothing happens)
 *   3 — Curious    (triggered by external stimulus, time-bounded)
 *   3 — Happy      (triggered by positive event, time-bounded)
 *   4 — Concerned  (empathetic attention, time-bounded)
 *   5 — Sleepy     (sticky — persists until explicitly cleared)
 *   6 — Focused    (highest priority, most restricted transitions)
 */
export const EMOTION_DEFINITIONS: Readonly<Record<Emotion, EmotionDefinition>> =
  {
    neutral: {
      id: "neutral",
      priority: 0,
      decayMs: null,
      interruptible: true,
      allowedFrom: "any",
    },

    relaxed: {
      id: "relaxed",
      priority: 1,
      decayMs: 30_000,
      interruptible: true,
      allowedFrom: "any",
    },

    waiting: {
      id: "waiting",
      priority: 2,
      decayMs: 15_000,
      interruptible: true,
      allowedFrom: "any",
    },

    curious: {
      id: "curious",
      priority: 3,
      decayMs: 8_000,
      interruptible: true,
      allowedFrom: "any",
    },

    happy: {
      id: "happy",
      priority: 3,
      decayMs: 10_000,
      interruptible: true,
      allowedFrom: "any",
    },

    concerned: {
      id: "concerned",
      priority: 4,
      decayMs: 12_000,
      interruptible: true,
      allowedFrom: "any",
    },

    sleepy: {
      id: "sleepy",
      priority: 5,
      decayMs: null,       // sticky — only cleared when user returns from idle
      interruptible: false,
      allowedFrom: "any",
    },

    focused: {
      id: "focused",
      priority: 6,
      decayMs: null,       // sticky — only cleared by an explicit wakeup
      interruptible: false,
      // focused may only be entered from calm, non-active states
      allowedFrom: ["neutral", "relaxed", "waiting"],
    },

    sad: {
      id: "sad",
      priority: 3,
      decayMs: 15_000,
      interruptible: true,
      allowedFrom: "any",
    },

    bored: {
      id: "bored",
      priority: 2,
      decayMs: 30_000,
      interruptible: true,
      allowedFrom: "any",
    },

    alert: {
      id: "alert",
      priority: 4,
      decayMs: 5_000,
      interruptible: true,
      allowedFrom: "any",
    },

    energetic: {
      id: "energetic",
      priority: 4,
      decayMs: 20_000,
      interruptible: true,
      allowedFrom: "any",
    },
  };
