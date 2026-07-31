import type { BehaviorContext } from "./behavior";
import type { BehaviorDefinition } from "./behavior-definition";

/** Runtime record pairing a definition with its live canExecute guard. */
export interface RegisteredBehavior {
  definition: BehaviorDefinition;
  canExecute(context: BehaviorContext): boolean;
  execute(context: BehaviorContext): void;
}

/** A behavior the BehaviorEngine has selected and is ready to run. */
export interface SelectedBehavior {
  registered: RegisteredBehavior;
  /** The effective weight used in this selection (after recency penalty applied). */
  effectiveWeight: number;
}

/**
 * BehaviorEngine — orchestrates how Mitra decides what to do next.
 *
 * Responsibilities:
 *  - Register behaviors with their static definitions.
 *  - On each tick: filter eligible behaviors (canExecute + cooldown).
 *  - Group by priority bracket; only consider the highest occupied bracket.
 *  - Within that bracket: probabilistic weighted-random selection.
 *  - Apply recency penalty to recently chosen behaviors to avoid repetition.
 *  - Track cooldowns per behavior id.
 *  - Expose the selected behavior for the Brain to execute.
 */
export interface BehaviorEngine {
  register(behavior: RegisteredBehavior): void;
  /** Remove a behavior from the engine. */
  unregister(id: string): void;
  /**
   * Evaluate all behaviors and return the one that should run this tick.
   * Returns null if no behavior is eligible (should not happen if IdleBehavior is registered).
   */
  select(context: BehaviorContext): RegisteredBehavior | null;
  /** Notify the engine that the given behavior was actually executed this tick. */
  markExecuted(id: string): void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Weighted random selection over a pre-filtered set. */
function weightedRandom(
  candidates: Array<{ behavior: RegisteredBehavior; weight: number }>,
): RegisteredBehavior | null {
  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.behavior;
  }
  // Floating-point safety fallback
  return candidates[candidates.length - 1]?.behavior ?? null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * How many recently executed behaviors to remember.
 * A behavior is penalised for each occurrence in this window.
 */
const HISTORY_SIZE = 5;

/**
 * The fractional weight penalty applied per recent occurrence.
 * 0.5 = each recurrence halves the effective weight.
 */
const RECENCY_PENALTY = 0.5;

export function createBehaviorEngine(): BehaviorEngine {
  let behaviors: RegisteredBehavior[] = [];
  /** id → timestamp of last execution */
  const cooldowns = new Map<string, number>();
  /** Ring buffer of recently executed behavior ids */
  const history: string[] = [];

  const isOnCooldown = (id: string, cooldownMs: number): boolean => {
    const last = cooldowns.get(id);
    return last !== undefined && Date.now() - last < cooldownMs;
  };

  const recencyCount = (id: string): number =>
    history.filter((h) => h === id).length;

  const effectiveWeight = (b: RegisteredBehavior): number => {
    const base = b.definition.weight;
    const count = recencyCount(b.definition.id);
    // Each recurrence in the history window multiplies by RECENCY_PENALTY.
    return base * Math.pow(RECENCY_PENALTY, count);
  };

  return {
    register(behavior: RegisteredBehavior) {
      // Prevent duplicates
      if (!behaviors.some(b => b.definition.id === behavior.definition.id)) {
        behaviors.push(behavior);
      }
    },

    unregister(id: string) {
      behaviors = behaviors.filter((b) => b.definition.id !== id);
      cooldowns.delete(id);
    },

    select(context: BehaviorContext): RegisteredBehavior | null {
      const now = Date.now();

      // Step 1 — gather all behaviors that pass their guard AND are not on cooldown.
      const eligible = behaviors.filter(
        (b) =>
          b.canExecute(context) &&
          !isOnCooldown(b.definition.id, b.definition.cooldownMs),
      );

      if (eligible.length === 0) return null;

      // Step 2 — find the highest priority bracket among eligible behaviors.
      const maxPriority = Math.max(
        ...eligible.map((b) => b.definition.priority),
      );

      // Step 3 — keep only behaviors in the top bracket.
      const topBracket = eligible.filter(
        (b) => b.definition.priority === maxPriority,
      );

      // Step 4 — build weighted candidates, applying recency penalty.
      const candidates = topBracket
        .map((b) => ({ behavior: b, weight: effectiveWeight(b) }))
        .filter((c) => c.weight > 0);

      if (candidates.length === 0) {
        // Every candidate has been penalised to 0 — pick uniformly at random
        // from the top bracket to break the deadlock.
        const i = Math.floor(Math.random() * topBracket.length);
        return topBracket[i] ?? null;
      }

      // Step 5 — weighted random selection.
      void now; // suppress unused variable warning
      return weightedRandom(candidates);
    },

    markExecuted(id: string) {
      cooldowns.set(id, Date.now());
      history.push(id);
      if (history.length > HISTORY_SIZE) {
        history.shift();
      }
    },
  };
}
