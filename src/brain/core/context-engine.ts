import { ContextState, TimeOfDay, UserState } from "./types";
import type { MeetingState } from "@/system/meeting-system";

export interface ContextEngine {
  // NOTE: tick() is now synchronous — it no longer fires its own IPC calls.
  // Meeting/coding state comes from MeetingSystem (already polled every 30s).
  // This eliminates a second independent IPC polling source that was duplicating
  // sysinfo lookups at a different cadence (10s vs 30s).
  tick(
    currentContext: ContextState,
    setContext: (ctx: Partial<ContextState>) => void,
    meetingState?: MeetingState,
  ): void;
}

function calculateTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  if (hour >= 21 && hour < 24) return "Night";
  return "LateNight"; // 00:00 to 05:00
}

function synthesizeUserState(context: ContextState): UserState {
  if (context.isMeetingRunning) return "Meeting";
  if (context.isFullscreen) return "Focused";

  const now = Date.now();
  const idleTime = now - context.lastUserInteraction;

  if (idleTime > 60 * 60 * 1000) return "Away";       // 1 hour idle
  if (idleTime > 15 * 60 * 1000) return "Focused";    // 15 min deep work
  return "Available";
}

export function createContextEngine(): ContextEngine {
  return {
    tick(currentContext, setContext, meetingState) {
      const updates: Partial<ContextState> = {};
      let stateChanged = false;

      // Time of day — pure computation, no IPC needed
      const timeOfDay = calculateTimeOfDay();
      if (timeOfDay !== currentContext.timeOfDay) {
        updates.timeOfDay = timeOfDay;
        stateChanged = true;
      }

      // Meeting / coding state — read from MeetingSystem snapshot.
      // MeetingSystem polls sysinfo every 30s via the central Scheduler.
      // We no longer issue our own IPC calls here, eliminating the duplicate
      // 10s polling and the fire-and-forgotten async promise that was running
      // outside the brain tick cycle with no ordering guarantee.
      if (meetingState) {
        if (meetingState.inMeeting !== currentContext.isMeetingRunning) {
          updates.isMeetingRunning = meetingState.inMeeting;
          stateChanged = true;
        }
        if (meetingState.inCoding !== currentContext.isCoding) {
          updates.isCoding = meetingState.inCoding;
          stateChanged = true;
        }
      }

      // Synthesize user state from the (potentially updated) context
      const syntheticContext = { ...currentContext, ...updates };
      const newUserState = synthesizeUserState(syntheticContext);
      if (newUserState !== currentContext.userState) {
        updates.userState = newUserState;
        stateChanged = true;
      }

      if (stateChanged) {
        setContext(updates);
      }
    },
  };
}
