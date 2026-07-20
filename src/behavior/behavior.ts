import type { Animation, Character, Emotion, Interaction, MovementIntent } from "@/types";
import type { EnvironmentSnapshot } from "@/system/environment";

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
  character: Character;
  environment: EnvironmentSnapshot;
  /**
   * Request an emotional transition through the EmotionEngine.
   * Returns true if the engine accepted the push.
   */
  pushEmotion(emotion: Emotion): boolean;
  /** Direct engine override — bypasses EmotionEngine rules entirely. */
  setEmotion(emotion: Emotion): void;
  setAnimation(animation: Animation): void;
  setInteraction(interaction: Interaction): void;
  /** Emits a movement intent to the Brain. The Brain decides if movement is permitted. */
  requestMovement(intent: MovementIntent): void;
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
