import type { Emotion } from "@/types";
import { EMOTION_DEFINITIONS } from "./emotion-definitions";

/**
 * The active slot held by the EmotionEngine at any point in time.
 * Exposed for inspection (e.g., debug overlays, tests).
 */
export interface EmotionSlot {
  emotion: Emotion;
  /** Unix timestamp (ms) at which this emotion will decay. null = sticky. */
  decaysAt: number | null;
}

/**
 * EmotionEngine — manages Mitra's internal emotional state.
 *
 * Responsibilities:
 *   - Accept emotional pushes from behaviors via priority and transition rules.
 *   - Advance decay timers each Brain tick.
 *   - Provide the resolved current emotion to the CompanionEngine.
 *
 * The EmotionEngine is completely separated from the rendering layer.
 * It produces a single Emotion value; the Body decides how to draw it.
 */
export interface EmotionEngine {
  /**
   * Attempt to transition into a new emotional state.
   *
   * Returns true if the push was accepted, false if it was rejected.
   * Rejection reasons:
   *   - The transition from the current state is not in `allowedFrom`.
   *   - The current emotion is not interruptible and the incoming priority
   *     is not strictly higher.
   */
  push(emotion: Emotion): boolean;

  /**
   * Force the engine back to neutral, bypassing all rules.
   * Use only for system-level resets (e.g., user returns from a long idle).
   */
  clear(): void;

  /**
   * Advance decay timers. Call once per Brain tick.
   * If the active emotion has expired, it silently resets to neutral.
   */
  tick(): void;

  /** The emotion that should currently be displayed. */
  getCurrent(): Emotion;

  /** Inspect the full active slot for debugging. */
  getSlot(): EmotionSlot;
}

export function createEmotionEngine(): EmotionEngine {
  let active: Emotion = "neutral";
  let decaysAt: number | null = null;

  return {
    push(emotion: Emotion): boolean {
      const incoming = EMOTION_DEFINITIONS[emotion];
      const current = EMOTION_DEFINITIONS[active];

      // Rule 1: Transition guard — is the incoming state reachable from the current one?
      if (
        incoming.allowedFrom !== "any" &&
        !incoming.allowedFrom.includes(active)
      ) {
        return false;
      }

      // Rule 2: Interruptibility — can the current emotion be displaced?
      // An uninterruptible state can only be overridden by a strictly higher priority.
      if (!current.interruptible && incoming.priority <= current.priority) {
        return false;
      }

      // Accepted — apply the new state.
      active = emotion;
      decaysAt =
        incoming.decayMs !== null ? Date.now() + incoming.decayMs : null;

      return true;
    },

    clear(): void {
      active = "neutral";
      decaysAt = null;
    },

    tick(): void {
      if (decaysAt !== null && Date.now() >= decaysAt) {
        active = "neutral";
        decaysAt = null;
      }
    },

    getCurrent(): Emotion {
      return active;
    },

    getSlot(): EmotionSlot {
      return { emotion: active, decaysAt };
    },
  };
}
