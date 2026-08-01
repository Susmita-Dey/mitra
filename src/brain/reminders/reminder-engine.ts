import type { CompanionMemory, ReminderItem } from "../memory";
import type { AppPreferences } from "@/types";
import type { TimelineEngine } from "../timeline";

import type { ContextState } from "../core/types";

const INTERACTION_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown after user interaction
const TRIGGERED_TIMEOUT_MS = 5 * 60 * 1000;    // Move to "ignored" if not clicked in 5 mins

export interface ReminderEngine {
  tick(
    memory: CompanionMemory, 
    setMemory: (update: Partial<CompanionMemory>) => void,
    prefs: AppPreferences,
    timeline: TimelineEngine,
    context: ContextState
  ): void;
}

function calculateNextSchedule(config: { intervalMs: number, jitterMs: number, time?: string }, state: ReminderItem["state"]): number {
  const now = new Date();

  if (config.time) {
    // Clock-time based scheduling (e.g. "13:00") - Exact, no jitter
    const [hours, minutes] = config.time.split(":").map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime.getTime() <= now.getTime()) {
      if (state === "idle") {
         // If the time has passed today (and we just booted up), check if it was within the last 2 hours
         const missedByMs = now.getTime() - scheduledTime.getTime();
         if (missedByMs > 2 * 60 * 60 * 1000) {
           // Missed by more than 2 hours, skip today and schedule for tomorrow
           scheduledTime.setDate(scheduledTime.getDate() + 1);
         }
      } else {
         // If it was just acknowledged, ignored, or completed, we MUST schedule it for tomorrow
         // to avoid an instant re-trigger infinite loop!
         scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
    }
    return scheduledTime.getTime();
  }

  // Interval-based scheduling
  const base = now.getTime() + config.intervalMs;
  const jitter = (Math.random() * 2 - 1) * config.jitterMs; // +/- jitter
  // Guarantee at least 10 seconds in the future, to prevent instant re-trigger loops
  // especially if the user sets intervalMs to 0 for testing.
  return Math.max(now.getTime() + 10000, base + jitter);
}

export function createReminderEngine(): ReminderEngine {
  let wasInMeeting = false;
  let missedDuringMeeting: string[] = [];

  return {
    tick(memory, setMemory, prefs, timeline, context) {
      if (!prefs.reminders.enabled) return;

      const now = Date.now();
      let changed = false;
      const active = { ...memory.activeReminders };
      let newTimeline = memory.timeline;

      // 1. Check for missing schedule (initial boot) or reset "completed/ignored"
      for (const key of Object.keys(active) as Array<keyof typeof active>) {
        const item = active[key];
        const config = prefs.reminders[key];
        
        if (item.state === "idle" || item.state === "completed" || item.state === "ignored" || item.state === "acknowledged") {
          // Schedule it
          item.scheduledFor = calculateNextSchedule(config, item.state);
          item.state = "scheduled";
          changed = true;
          newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Scheduled ${key} for ${new Date(item.scheduledFor).toLocaleTimeString()}`);
        } else if (item.state === "scheduled" && item.scheduledFor) {
          if (config.time) {
            // Clock time logic - checking if scheduled time matches expected clock time (today or tomorrow)
            const expectedToday = new Date();
            const [hours, minutes] = config.time.split(":").map(Number);
            expectedToday.setHours(hours, minutes, 0, 0);
            
            const expectedTomorrow = new Date(expectedToday);
            expectedTomorrow.setDate(expectedTomorrow.getDate() + 1);
            
            // If the exact scheduled time doesn't match the config time, it means the settings changed
            if (item.scheduledFor !== expectedToday.getTime() && item.scheduledFor !== expectedTomorrow.getTime()) {
              item.scheduledFor = calculateNextSchedule(config, item.state);
              changed = true;
              newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Rescheduled ${key} due to clock time change`);
            } else if (now > item.scheduledFor + 2 * 60 * 60 * 1000) {
              // Deadload fix: If a clock-time reminder was missed by more than 2 hours, skip it and reschedule
              item.scheduledFor = calculateNextSchedule(config, "completed"); // Force next day calculation
              changed = true;
              newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Skipped severely overdue ${key} and rescheduled`);
            }
          } else {
            // Interval logic
            const maxAllowedTime = now + config.intervalMs + config.jitterMs;
            if (item.scheduledFor > maxAllowedTime) {
               item.scheduledFor = calculateNextSchedule(config, item.state);
               changed = true;
               newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Rescheduled ${key} due to settings change`);
            }
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
          // Check for Context-based Deferrals
          if (context.userState === "Meeting") {
            // Defer entirely and track for summary
            mostOverdue.state = "ignored";
            mostOverdue.scheduledFor = calculateNextSchedule(prefs.reminders[mostOverdue.id], "ignored");
            missedDuringMeeting.push(mostOverdue.id);
            changed = true;
            newTimeline = timeline.push(newTimeline, "reminder:deferred", `Deferred ${mostOverdue.id} due to Meeting`);
          } else if (context.userState === "Focused" && mostOverdue.id !== "water") {
            // Defer non-critical things while Focused
            mostOverdue.scheduledFor = now + 15 * 60 * 1000; // Bump by 15 mins
            changed = true;
            newTimeline = timeline.push(newTimeline, "reminder:deferred", `Deferred ${mostOverdue.id} 15m due to Focused state`);
          } else {
            // Trigger normally
            mostOverdue.state = "triggered";
            mostOverdue.scheduledFor = now; 
            changed = true;
            newTimeline = timeline.push(newTimeline, "reminder:triggered", `Triggered ${mostOverdue.id}`);

            // Stampede prevention
            for (const key of Object.keys(active) as Array<keyof typeof active>) {
              const other = active[key];
              const otherConfig = prefs.reminders[key];
              if (other.id !== mostOverdue.id && other.state === "scheduled" && other.scheduledFor && now >= other.scheduledFor) {
                 if (!otherConfig.time) {
                   const bumpMs = Math.min(10 * 60 * 1000, otherConfig.intervalMs || 10 * 60 * 1000);
                   other.scheduledFor = now + bumpMs;
                   newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Bumped ${key} to prevent reminder stampede`);
                   changed = true;
                 }
              }
            }
          }
        }
      }

      // 4. Meeting Summary Logic
      if (wasInMeeting && context.userState !== "Meeting") {
        if (missedDuringMeeting.length > 0) {
           // Create a synthetic interaction or bubble
           newTimeline = timeline.push(newTimeline, "reminder:summary", `Summarized missed items: ${missedDuringMeeting.join(", ")}`);
           // We could inject a special interaction state here, for now we just clear it
           missedDuringMeeting = [];
           changed = true;
        }
      }
      wasInMeeting = context.userState === "Meeting";

      if (changed) {
        setMemory({ activeReminders: active, timeline: newTimeline });
      }
    }
  };
}
