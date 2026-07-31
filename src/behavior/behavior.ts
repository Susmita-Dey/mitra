// Unused imports removed
import type { CompanionMemory } from "../brain/memory";

/**
 * Context passed to behaviors on each Brain tick.
 *
 * Behaviors must use `pushEmotion` for all normal emotional transitions.
 * The EmotionEngine will evaluate the push against priority, interruptibility,
 * and transition rules before accepting or rejecting it.
 *
 * `setEmotion` is a direct override that bypasses all rules.
 * Reserve it for critical system resets (e.g., clearing sleepy when user returns).
 *
 * `environment` is a read-only snapshot of the OS environment captured this tick.
 * Behaviors read it to make context-aware decisions (e.g., sleep when idle).
 */
export interface BehaviorContext {
  world: import("@/types").WorldState;
  setMemory(update: Partial<CompanionMemory>): void;
  emit(intent: import("@/types").Intent): void;
}

/**
 * Behavior — a single expressive action the companion can perform.
 *
 * The interface defines how the brain will select and run them by priority.
 */
export interface Behavior {
  id: string;
  priority: number;
  canExecute(context: BehaviorContext): boolean;
  execute(context: BehaviorContext): void;
}
