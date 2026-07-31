import type { CompanionMemory } from "./memory";

/**
 * MemoryEngine — Manages the companion's simple memory state.
 *
 * This provides consistent access to long-term memory traits across ticks,
 * avoiding the complexity of full AI contextual memory.
 */
export interface MemoryEngine {
  /** Get the current memory state snapshot. */
  get(): Readonly<CompanionMemory>;
  /** Update specific fields in memory. */
  update(partial: Partial<CompanionMemory>): void;
}

const INITIAL_MEMORY: CompanionMemory = {
  bootTime: Date.now(),
  hasGreeted: false,
  lastInteractionTime: null,
  consecutiveIgnoredReminders: 0,
  favoriteSpot: null,
  interactionCount: 0,
  wasAsleep: true, // Start off asleep for the boot sequence!
  activeReminders: {
    water: { id: "water", state: "idle", scheduledFor: null },
    stretch: { id: "stretch", state: "idle", scheduledFor: null },
    eyes: { id: "eyes", state: "idle", scheduledFor: null },
    lunch: { id: "lunch", state: "idle", scheduledFor: null },
  },
  lastUserInteraction: Date.now(),
  lastTickle: 0,
  timeline: [],
};

export function createMemoryEngine(): MemoryEngine {
  let memory: CompanionMemory = { ...INITIAL_MEMORY };

  return {
    get() {
      return memory;
    },
    update(partial: Partial<CompanionMemory>) {
      memory = { ...memory, ...partial };
    },
  };
}
