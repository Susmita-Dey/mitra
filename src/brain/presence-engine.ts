import type { EnvironmentSnapshot } from "@/system/environment";
import type { PresenceState } from "@/types";
import type { CompanionMemory } from "./memory";

export interface PresenceEngine {
  /**
   * Determine where Mitra should logically exist or what her presence should be.
   */
  tick(environment: EnvironmentSnapshot, memory: CompanionMemory): PresenceState;
}

export function createPresenceEngine(): PresenceEngine {
  return {
    tick(environment, memory) {
      if (memory.wasAsleep) {
        return "Sleep";
      }
      
      // If the user hasn't interacted or typed/moved the mouse in a long time
      if (environment.idleMs > 5 * 60 * 1000) {
        return "Sleep";
      }

      // Default presence for now
      return "Taskbar";
    }
  };
}
