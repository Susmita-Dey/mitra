import { invoke } from "@tauri-apps/api/core";
import { ContextState, TimeOfDay, UserState } from "./types";

export interface ContextEngine {
  tick(currentContext: ContextState, setContext: (ctx: Partial<ContextState>) => void): Promise<void>;
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
  if (context.isFullscreen) return "Focused"; // Assumption: Fullscreen often means focused (movie/game/presentation)
  
  const now = Date.now();
  const idleTime = now - context.lastUserInteraction;
  
  if (idleTime > 60 * 60 * 1000) return "Away"; // 1 hour idle
  if (idleTime > 15 * 60 * 1000) return "Focused"; // 15 mins idle implies deep work, not away
  
  return "Available";
}

export function createContextEngine(): ContextEngine {
  let lastMeetingCheck = 0;
  
  return {
    async tick(currentContext, setContext) {
      const now = Date.now();
      const updates: Partial<ContextState> = {};
      let stateChanged = false;

      // Update time of day
      const timeOfDay = calculateTimeOfDay();
      if (timeOfDay !== currentContext.timeOfDay) {
        updates.timeOfDay = timeOfDay;
        stateChanged = true;
      }

      // Check meeting status via OS process check every 10 seconds to save CPU
      if (now - lastMeetingCheck > 10000) {
        lastMeetingCheck = now;
        try {
          const isMeetingRunning = await invoke<boolean>("check_meeting_status");
          if (isMeetingRunning !== currentContext.isMeetingRunning) {
            updates.isMeetingRunning = isMeetingRunning;
            stateChanged = true;
          }
          
          const isCoding = await invoke<boolean>("check_coding_status");
          if (isCoding !== currentContext.isCoding) {
            updates.isCoding = isCoding;
            stateChanged = true;
          }
        } catch (err) {
          console.warn("[ContextEngine] Failed to check OS process status", err);
        }
      }

      // We might add fullscreen check via Tauri later. 
      // For now, we synthesize UserState based on what we have.
      const syntheticContext = { ...currentContext, ...updates };
      const newUserState = synthesizeUserState(syntheticContext);
      
      if (newUserState !== currentContext.userState) {
        updates.userState = newUserState;
        stateChanged = true;
      }

      if (stateChanged) {
        setContext(updates);
      }
    }
  };
}
