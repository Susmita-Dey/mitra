import type { CompanionMemory, ReminderItem } from "../memory";
import type { AppPreferences } from "@/types";
import type { TimelineEngine } from "../timeline";

import type { ContextState } from "../core/types";

const INTERACTION_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown after user interaction
const TRIGGERED_TIMEOUT_MS = 2 * 60 * 1000;    // Move to "ignored" if not clicked in 5 mins

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

function calculateCustomNextSchedule(config: { intervalMs?: number, time?: string, countdownMs?: number, createdAt: number }, state: ReminderItem["state"]): number {
  const now = new Date();

  // 1. One-shot countdown
  if (config.countdownMs) {
    if (state === "idle") {
      return config.createdAt + config.countdownMs;
    }
    // If acknowledged/ignored/completed, don't trigger again (keep scheduled far in future until deleted)
    return Date.now() + 365 * 24 * 60 * 60 * 1000;
  }

  // 2. Clock-time based (Daily)
  if (config.time) {
    const [hours, minutes] = config.time.split(":").map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime.getTime() <= now.getTime()) {
      if (state === "idle") {
         const missedByMs = now.getTime() - scheduledTime.getTime();
         if (missedByMs > 2 * 60 * 60 * 1000) {
           scheduledTime.setDate(scheduledTime.getDate() + 1);
         }
      } else {
         scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
    }
    return scheduledTime.getTime();
  }

  // 3. Interval-based
  const interval = config.intervalMs || 30 * 60 * 1000;
  const base = now.getTime() + interval;
  // Guarantee at least 10s in future
  return Math.max(now.getTime() + 10000, base);
}

export function createReminderEngine(): ReminderEngine {
  let wasInMeeting = false;

  return {
    tick(memory, setMemory, prefs, timeline, context) {
      if (!prefs.reminders.enabled) return;

      const now = Date.now();
      let changed = false;
      const active = { ...memory.activeReminders };
      let newTimeline = memory.timeline;

      // 1. Sync custom reminders from preferences to active memory state
      const customReminders = prefs.customReminders || [];
      const customKeysInActive = Object.keys(active).filter(k => k.startsWith("custom_"));
      const customIdsInPrefs = new Set(customReminders.map(r => r.id));

      // Clean up deleted custom reminders from active memory
      for (const key of customKeysInActive) {
        if (!customIdsInPrefs.has(key)) {
          delete active[key];
          changed = true;
          newTimeline = timeline.push(newTimeline, "reminder:deleted", `Removed inactive custom reminder ${key}`);
        }
      }

      // Initialize/sync active custom reminders
      for (const custom of customReminders) {
        if (!custom.enabled) {
          if (active[custom.id]) {
            delete active[custom.id];
            changed = true;
          }
          continue;
        }

        const item = active[custom.id];
        if (!item || item.state === "idle" || item.state === "completed" || item.state === "ignored" || item.state === "acknowledged") {
          const state = item ? item.state : "idle";
          const scheduledFor = calculateCustomNextSchedule(custom, state);
          
          active[custom.id] = {
            id: custom.id as any,
            state: "scheduled",
            scheduledFor
          };
          changed = true;
          newTimeline = timeline.push(
            newTimeline,
            "reminder:scheduled",
            `Scheduled custom reminder ${custom.label} for ${new Date(scheduledFor).toLocaleTimeString()}`
          );
        }
      }

      // 2. Check for standard missing schedule (initial boot) or reset "completed/ignored"
      const standardKeys = ["water", "stretch", "eyes", "lunch", "dinner", "snack", "bio"] as const;
      for (const key of standardKeys) {
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

      // 3. Check triggered timeouts (ignored) for all active reminders
      for (const key of Object.keys(active)) {
        const item = active[key];
        // If it's been triggered for too long without ack, mark as ignored
        if (item.state === "triggered" && item.scheduledFor && now - item.scheduledFor > TRIGGERED_TIMEOUT_MS) {
          item.state = "ignored";
          changed = true;
          newTimeline = timeline.push(newTimeline, "reminder:ignored", `${key} was ignored. Rescheduling.`);
        }
      }

      // 4. Queue logic: Only ONE reminder can be triggered at a time.
      const isAnythingTriggered = Object.values(active).some(r => r.state === "triggered");
      const inCooldown = (now - memory.lastUserInteraction) < INTERACTION_COOLDOWN_MS;

      if (!isAnythingTriggered && !inCooldown) {
        // Find the most overdue scheduled reminder (standard or custom)
        let mostOverdue: ReminderItem | null = null;
        
        for (const key of Object.keys(active)) {
          const item = active[key];
          if (item.state === "scheduled" && item.scheduledFor && now >= item.scheduledFor) {
            if (!mostOverdue || (mostOverdue.scheduledFor && item.scheduledFor < mostOverdue.scheduledFor)) {
              mostOverdue = item;
            }
          }
        }

        if (mostOverdue) {
          // Check for Context-based Deferrals or Hidden State
          const isHidden = (window as any).IS_HIDDEN === true;
          
          if (context.userState === "Meeting" || isHidden) {
            // Defer entirely and track for summary
            mostOverdue.state = "ignored";
            
            if (mostOverdue.id.startsWith("custom_")) {
              const customRem = customReminders.find(r => r.id === mostOverdue.id);
              mostOverdue.scheduledFor = customRem ? calculateCustomNextSchedule(customRem, "ignored") : now + 5 * 60 * 1000;
            } else {
              mostOverdue.scheduledFor = calculateNextSchedule(prefs.reminders[mostOverdue.id as ReminderItem["id"]], "ignored");
            }
            
            const currentTracker = memory.meetingTracker || { meetingStartTime: null, missedReminders: [] };
            const newTracker = { 
              ...currentTracker, 
              missedReminders: [...currentTracker.missedReminders, mostOverdue.id] 
            };
            
            changed = true;
            newTimeline = timeline.push(newTimeline, "reminder:deferred", `Deferred ${mostOverdue.id} due to ${isHidden ? 'Hidden' : 'Meeting'}`);
            setMemory({ activeReminders: active, timeline: newTimeline, meetingTracker: newTracker });
            return; // Exit early since we called setMemory manually
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
            for (const key of Object.keys(active)) {
              const other = active[key];
              if (other.id !== mostOverdue.id && other.state === "scheduled" && other.scheduledFor && now >= other.scheduledFor) {
                 if (other.id.startsWith("custom_")) {
                   other.scheduledFor = now + 5 * 60 * 1000; // Bump custom reminders by 5 mins
                   newTimeline = timeline.push(newTimeline, "reminder:scheduled", `Bumped custom ${key} to prevent reminder stampede`);
                   changed = true;
                 } else {
                   const otherConfig = prefs.reminders[other.id as ReminderItem["id"]];
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
      }

      // 5. Meeting Summary Logic
      if (wasInMeeting && context.userState !== "Meeting") {
        // This is now handled globally by CatchUpBehavior when window is shown
      }
      wasInMeeting = context.userState === "Meeting";

      if (changed) {
        setMemory({ activeReminders: active, timeline: newTimeline });
      }
    }
  };
}
