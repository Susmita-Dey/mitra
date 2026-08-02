import type {
  Animation,
  Character,
  Emotion,
  Interaction,
  Position,
} from "@/types";
import { createCharacter } from "@/types";

/**
 * A zero-argument notification callback — matches the signature
 * that React's useSyncExternalStore passes to subscribe.
 */
export type ChangeListener = () => void;

/**
 * Companion Engine — single source of truth for character state.
 *
 * State axes stay independent: the brain can change emotion without touching
 * animation, and the body reads a snapshot without owning any logic.
 *
 * subscribe() accepts a zero-argument callback so it composes directly
 * with React's useSyncExternalStore without an adapter layer.
 */
export interface CompanionEngine {
  getCharacter(): Character;
  subscribe(listener: ChangeListener): () => void;
  setPosition(position: Position): void;
  setAnimation(animation: Animation): void;
  setEmotion(emotion: Emotion): void;
  setInteraction(interaction: Interaction): void;
  setProceduralState(state: import("../brain/core/types").ProceduralAnimationState): void;
  setBubbleText(text: string | null): void;
  setEnergy(energy: number): void;
  setAttention(attention: number): void;
}

export function createCompanionEngine(
  initial?: Partial<Character>,
): CompanionEngine {
  let character = createCharacter(initial);
  const listeners = new Set<ChangeListener>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const patch = (next: Partial<Character>): void => {
    let hasChanges = false;
    for (const key of Object.keys(next) as Array<keyof Character>) {
      if (key === "proceduralState") {
        if (JSON.stringify(character.proceduralState) !== JSON.stringify(next.proceduralState)) {
          hasChanges = true;
          break;
        }
      } else if (character[key] !== next[key]) {
        hasChanges = true;
        break;
      }
    }

    if (!hasChanges) return; // Prevent unnecessary React re-renders

    character = { ...character, ...next };
    notify();
  };

  return {
    getCharacter: () => character,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setPosition: (position) => patch({ position }),
    setAnimation: (animation) => patch({ animation }),
    setEmotion: (emotion) => patch({ emotion }),
    setInteraction: (interaction) => patch({ interaction }),
    setProceduralState: (proceduralState) => patch({ proceduralState }),
    setBubbleText: (bubbleText) => patch({ bubbleText }),
    setEnergy: (energy) => patch({ energy }),
    setAttention: (attention) => patch({ attention }),
  };
}
