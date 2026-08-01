import { invoke } from "@tauri-apps/api/core";

export interface MeetingState {
  inMeeting: boolean;
  inCoding: boolean;
  lastUpdated: number;
}

export interface MeetingSystem {
  getState(): MeetingState;
  start(): void;
}

export function createMeetingSystem(): MeetingSystem {
  let currentState: MeetingState = {
    inMeeting: false,
    inCoding: false,
    lastUpdated: 0,
  };
  let hasStarted = false;

  const checkMeeting = async () => {
    try {
      const inMeeting = await invoke<boolean>("check_meeting_status");
      const inCoding = await invoke<boolean>("check_coding_status");
      currentState = {
        inMeeting,
        inCoding,
        lastUpdated: Date.now(),
      };
    } catch (err) {
      console.warn("[MeetingSystem] Failed to check meeting status", err);
    }
  };

  return {
    start() {
      if (hasStarted) return;
      hasStarted = true;
      
      checkMeeting();
      setInterval(checkMeeting, 60_000); // Check every minute
    },
    getState() {
      return currentState;
    }
  };
}
