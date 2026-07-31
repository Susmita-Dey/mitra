import type { TimelineEvent } from "./timeline";

export type ReminderState = "idle" | "scheduled" | "triggered" | "acknowledged" | "snoozed" | "ignored" | "completed";

export interface ReminderItem {
  id: "water" | "stretch" | "eyes" | "lunch";
  state: ReminderState;
  scheduledFor: number | null;
}

export interface CompanionMemory {
  /** Timestamp when the app was launched (or brain initialized) */
  bootTime: number;
  /** Whether the companion has performed the initial greeting sequence */
  hasGreeted: boolean;

  /** Timestamp of the last time the user actively interacted with Mitra (drag, pet, click). */
  lastInteractionTime: number | null;
  /** Number of times the user has ignored consecutive reminders. */
  consecutiveIgnoredReminders: number;
  /** Mitra's favorite resting spot on the screen (x, y coordinates). */
  favoriteSpot: { x: number; y: number } | null;
  /** Total number of interactions (petting, waving, etc). */
  interactionCount: number;
  /** Whether Mitra was asleep on the previous tick. */
  wasAsleep: boolean;

  // Reminders (Phase 3 Lifecycle)
  activeReminders: {
    water: ReminderItem;
    stretch: ReminderItem;
    eyes: ReminderItem;
    lunch: ReminderItem;
  };

  /** Timestamp of the last explicit user interaction (click, drag, hover, etc.) */
  lastUserInteraction: number;

  /** History of events for debugging and organic state evaluation */
  timeline: TimelineEvent[];
}
