import type { TimelineEvent } from "./timeline";

export type ReminderState = "idle" | "scheduled" | "triggered" | "acknowledged" | "snoozed" | "ignored" | "completed";

export interface ReminderItem {
  id: "water" | "stretch" | "eyes" | "lunch" | "dinner" | "snack" | "bio";
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
  /** Timestamp of the last explicit user interaction (click, drag, hover, etc.) */
  lastUserInteraction: number;
  /** Timestamp of the last tummy tickle. */
  lastTickle: number;

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
    dinner: ReminderItem;
    snack: ReminderItem;
    bio: ReminderItem;
  };

  /** History of events for debugging and organic state evaluation */
  timeline: TimelineEvent[];

  /** Currently playing interaction override (if any) */
  activeInteraction: { id: string; until: number } | null;

  /**
   * Personality traits (0.0 to 1.0).
   * Evolve slowly over time based on interaction patterns.
   */
  personality: {
    playful: number;
    curious: number;
    shy: number;
    gentle: number;
    energetic: number;
    sleepy: number;
  };
  
  /** Track long meetings and hidden states for the summary feature */
  meetingTracker: {
    meetingStartTime: number | null;
    missedReminders: string[];
  };
}

export const DEFAULT_MEMORY: CompanionMemory = {
  bootTime: Date.now(),
  hasGreeted: false,
  lastInteractionTime: null,
  lastUserInteraction: Date.now(),
  lastTickle: 0,
  consecutiveIgnoredReminders: 0,
  favoriteSpot: null,
  interactionCount: 0,
  wasAsleep: false,
  activeReminders: {
    water: { id: "water", state: "idle", scheduledFor: null },
    stretch: { id: "stretch", state: "idle", scheduledFor: null },
    eyes: { id: "eyes", state: "idle", scheduledFor: null },
    lunch: { id: "lunch", state: "idle", scheduledFor: null },
    dinner: { id: "dinner", state: "idle", scheduledFor: null },
    snack: { id: "snack", state: "idle", scheduledFor: null },
    bio: { id: "bio", state: "idle", scheduledFor: null },
  },
  timeline: [],
  activeInteraction: null,
  personality: {
    playful: 0.5,
    curious: 0.5,
    shy: 0.2,
    gentle: 0.5,
    energetic: 0.5,
    sleepy: 0.3,
  },
  meetingTracker: {
    meetingStartTime: null,
    missedReminders: [],
  }
};
