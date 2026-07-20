import type { Animation } from "@/types";

/**
 * Static configuration for a registered behavior.
 *
 * This is pure data — no logic, no closures. Separating it from the runtime
 * BehaviorRecord means it can be serialised, inspected, and tested independently.
 */
export interface BehaviorDefinition {
  /** Stable unique identifier. Used in history tracking and cooldown maps. */
  id: string;

  /**
   * Priority bracket.
   * Within the same bracket, selection is probabilistic (weighted).
   * Higher brackets always pre-empt lower brackets when eligible.
   *
   * Suggested brackets:
   *   100+  Critical (system-driven: drag, click)
   *   50–99 Active   (reminder-driven: future Phase 3)
   *   10–49 Reactive (user-presence: hover, look-around)
   *   0–9   Ambient  (autonomous idle behaviors)
   */
  priority: number;

  /**
   * Relative selection weight within the same priority bracket.
   * A behavior with weight 3 is 3× more likely to be chosen than one with weight 1,
   * assuming both are eligible. Weight 0 means never randomly selected (must be forced).
   */
  weight: number;

  /**
   * Minimum time (ms) that must pass before this behavior can run again.
   * Prevents the same action from repeating immediately.
   */
  cooldownMs: number;

  /**
   * The generic action this behavior maps to.
   * This is what gets passed to setAnimation — not a hardcoded animation name.
   * The Renderer (via character.json) maps actions to asset-specific animations.
   */
  action: Animation;

  /**
   * Whether this behavior may interrupt a currently running higher-priority behavior.
   * In Phase 1 the Brain runs a 1-second tick, so "interruption" happens on the next tick.
   */
  canInterrupt: boolean;
}
