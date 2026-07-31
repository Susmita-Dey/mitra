import type { CompanionMemory, ReminderItem } from "../memory";
import type { AppPreferences } from "@/types";
import type { TimelineEngine } from "../timeline";

const INTERACTION_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown after user interaction
const TRIGGERED_TIMEOUT_MS = 5 * 60 * 1000;    // Move to "ignored" if not clicked in 5 mins

export interface ReminderEngine {
  tick(
    memory: CompanionMemory, 
    setMemory: (update: Partial<CompanionMemory>) => void,
    prefs: AppPreferences,
    timeline: TimelineEngine
  ): void;
}

function calculateNextSchedule(intervalMs: number, jitterMs: number): number {
  const base = Date.now() + intervalMs;
  const jitter = (Math.random() * 2 - 1) * jitterMs; // +/- jitter
  return base + jitter;
}

export function createReminderEngine(): ReminderEngine {
  return {
    tick(memory, setMemory, prefs, timeline) {
      if (!prefs.reminders.enabled) return;

      const now = Date.now();
      let changed = false;
      const active = { ...memory.activeReminders };
      let newTimeline = memory.timeline;

      // 1. Check for missing schedule (initial boot) or reset "completed/ignored"
      for (const key of Object.keys(active) as Array<keyof typeof active>) {
        const item = active[key];
        const config = prefs.reminders[key];
        
        if (item.state === "idle" || item.state === "completed" || item.state === "ignored") {
          // Schedule it
          item.state = "scheduled";
          item.scheduledFor = calculateNextSchedule(config.intervalMs, config.jitterMs);
          changed = true;
          newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Scheduled ${key} for ${new Date(item.scheduledFor).toLocaleTimeString()}`);
        } else if (item.state === "scheduled" && item.scheduledFor) {
          // If user reduced the interval in settings and it's now scheduled too far in the future
          const maxAllowedTime = now + config.intervalMs + config.jitterMs;
          if (item.scheduledFor > maxAllowedTime) {
             item.scheduledFor = calculateNextSchedule(config.intervalMs, config.jitterMs);
             changed = true;
             newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Rescheduled ${key} due to settings change`);
          }
        }
      }

      // 2. Check triggered timeouts (ignored)
      for (const key of Object.keys(active) as Array<keyof typeof active>) {
        const item = active[key];
        // If it's been triggered for too long without ack, mark as ignored
        if (item.state === "triggered" && item.scheduledFor && now - item.scheduledFor > TRIGGERED_TIMEOUT_MS) {
          item.state = "ignored";
          changed = true;
          newTimeline = timeline.push(newTimeline, "reminder:ignored", `${key} was ignored. Rescheduling.`);
        }
      }

      // 3. Queue logic: Only ONE reminder can be triggered at a time.
      const isAnythingTriggered = Object.values(active).some(r => r.state === "triggered");
      const inCooldown = (now - memory.lastUserInteraction) < INTERACTION_COOLDOWN_MS;

      if (!isAnythingTriggered && !inCooldown) {
        // Find the most overdue scheduled reminder
        let mostOverdue: ReminderItem | null = null;
        
        for (const key of Object.keys(active) as Array<keyof typeof active>) {
          const item = active[key];
          if (item.state === "scheduled" && item.scheduledFor && now >= item.scheduledFor) {
            if (!mostOverdue || (mostOverdue.scheduledFor && item.scheduledFor < mostOverdue.scheduledFor)) {
              mostOverdue = item;
            }
          }
        }

        if (mostOverdue) {
          mostOverdue.state = "triggered";
          mostOverdue.scheduledFor = now; // reset the timestamp to when it actually triggered
          changed = true;
          newTimeline = timeline.push(newTimeline, "reminder:triggered", `Triggered ${mostOverdue.id}`);
        }
      }

      if (changed) {
        setMemory({ activeReminders: active, timeline: newTimeline });
      }
    }
  };
}
