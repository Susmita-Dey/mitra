export interface WindowPosition {
  x: number;
  y: number;
}

export interface ReminderPreferences {
  enabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "08:00"
  frequency: "low" | "medium" | "high";
}

export interface BehaviorPreferences {
  idleAnimations: boolean;
  wanderEnabled: boolean;
  interactionLevel: "minimal" | "normal" | "active";
}

export interface AnimationSettings {
  smoothTransitions: boolean;
  framerate: number; // e.g., 30 or 60
}

/**
 * The consolidated application state that requires persistence.
 */
export interface AppPreferences {
  version: number; // Used for migrations
  selectedCharacter: string;
  windowPosition: WindowPosition | null;
  reminders: ReminderPreferences;
  behavior: BehaviorPreferences;
  animation: AnimationSettings;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  version: 1,
  selectedCharacter: "mitra",
  windowPosition: null,
  reminders: {
    enabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    frequency: "medium",
  },
  behavior: {
    idleAnimations: true,
    wanderEnabled: false,
    interactionLevel: "normal",
  },
  animation: {
    smoothTransitions: true,
    framerate: 60,
  },
};
