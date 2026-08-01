import { invoke } from "@tauri-apps/api/core";
import type { SchedulerService } from "./scheduler";

export interface MeetingState {
  inMeeting: boolean;
  inCoding: boolean;
  lastUpdated: number;
}

export interface MeetingSystem {
  getState(): MeetingState;
  start(scheduler: SchedulerService): void;
  dispose(): void;
}

export function createMeetingSystem(): MeetingSystem {
  let currentState: MeetingState = {
    inMeeting: false,
    inCoding: false,
    lastUpdated: 0,
  };
  let hasStarted = false;
  let taskHandle: { cancel: () => void } | null = null;

  const checkMeeting = async () => {
    try {
      // Both Rust commands share a 30s-throttled sysinfo cache,
      // so calling them together costs only one refresh per 30s.
      const [inMeeting, inCoding] = await Promise.all([
        invoke<boolean>("check_meeting_status"),
        invoke<boolean>("check_coding_status"),
      ]);
      currentState = { inMeeting, inCoding, lastUpdated: Date.now() };
    } catch (err) {
      // Non-fatal: Tauri IPC may not be available in browser dev mode.
      console.warn("[MeetingSystem] Status check failed (expected in browser dev mode)", err);
    }
  };

  return {
    start(scheduler: SchedulerService) {
      if (hasStarted) return;
      hasStarted = true;

      // Run immediately, then every 30s (aligned with Rust sysinfo cache TTL).
      // Using the central Scheduler — no raw setInterval.
      checkMeeting();
      taskHandle = scheduler.schedule(checkMeeting, {
        intervalMs: 30_000,
        id: "system.meeting_check",
        priority: 0,
      });
    },

    dispose() {
      taskHandle?.cancel();
      taskHandle = null;
      hasStarted = false;
    },

    getState() {
      return currentState;
    },
  };
}
