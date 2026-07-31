import type { EnvironmentSnapshot } from "@/system/environment";
import type { PresenceState } from "@/types";
import type { CompanionMemory } from "./memory";
import type { MeetingState } from "@/system/meeting-system";

export interface PresenceEngine {
  /**
   * Determine where Mitra should logically exist or what her presence should be.
   */
  tick(environment: EnvironmentSnapshot, memory: CompanionMemory, meeting?: MeetingState): PresenceState;
}

export function createPresenceEngine(): PresenceEngine {
  // Simple state machine or tracking variables for presence could go here
  let cursorFollowStartTime = 0;
  let peekStartTime = 0;

  return {
    tick(environment, memory, meeting) {
      const now = Date.now();
      
      if (meeting?.inMeeting) {
        return "Hide";
      }

      if (memory.wasAsleep) {
        return "Sleep";
      }
      
      // If user is very idle, sleep
      if (environment.idleMs > 5 * 60 * 1000) {
        return "Sleep";
      }

      // If user is somewhat idle, lie down
      if (environment.idleMs > 2 * 60 * 1000) {
        return "LyingDown";
      }

      // If user is a bit idle, sit
      if (environment.idleMs > 30 * 1000) {
        return "Sitting";
      }

      // If the mouse is moving right now
      if (environment.mouseActive && environment.mouseIdleMs < 1000) {
        // Occasionally follow cursor briefly if not recently done
        if (now - cursorFollowStartTime > 60_000 && Math.random() < 0.05) {
          cursorFollowStartTime = now;
          return "FollowCursor";
        }
        
        if (now - cursorFollowStartTime < 3000) {
           return "FollowCursor";
        }
        
        return "WatchCursor";
      }

      // Randomly peek occasionally if recently active
      if (environment.idleMs < 10_000 && now - peekStartTime > 120_000 && Math.random() < 0.01) {
        peekStartTime = now;
        return "Peek";
      }
      if (now - peekStartTime < 5000) {
        return "Peek";
      }

      // Random wandering when awake but not immediately interacting
      if (environment.idleMs > 5000 && environment.idleMs < 20_000 && Math.random() < 0.05) {
         return "Wander";
      }

      // Default presence
      return "Taskbar";
    }
  };
}
