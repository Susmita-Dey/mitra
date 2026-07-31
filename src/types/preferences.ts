export interface WindowPosition {
  x: number;
  y: number;
}

export interface ReminderConfig {
  intervalMs: number;
  jitterMs: number; // e.g. 5 minutes randomness
}

export interface ReminderPreferences {
  enabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "08:00"
  water: ReminderConfig;
  stretch: ReminderConfig;
  eyes: ReminderConfig;
  lunch: ReminderConfig;
}

export interface BehaviorPreferences {
  idleAnimations: boolean;
  wanderEnabled: boolean;
  interactionLevel: "minimal" | "normal" | "active";
  clickThrough: boolean;
  weatherLocation?: string;
}

export interface AnimationSettings {
  smoothTransitions: boolean;
  framerate: number; // e.g., 30 or 60
}

export interface AudioPreferences {
  muteSounds: boolean;
  volume: number; // 0.0 to 1.0
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
  audio: AudioPreferences;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  version: 1,
  selectedCharacter: "mitra",
  windowPosition: null,
  reminders: {
    enabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    water: { intervalMs: 2 * 60 * 60 * 1000, jitterMs: 10 * 60 * 1000 },
    stretch: { intervalMs: 60 * 60 * 1000, jitterMs: 5 * 60 * 1000 },
    eyes: { intervalMs: 30 * 60 * 1000, jitterMs: 2 * 60 * 1000 },
    lunch: { intervalMs: 4 * 60 * 60 * 1000, jitterMs: 15 * 60 * 1000 },
  },
  behavior: {
    idleAnimations: true,
    wanderEnabled: false,
    interactionLevel: "normal",
    clickThrough: false,
    weatherLocation: "",
  },
  animation: {
    smoothTransitions: true,
    framerate: 60,
  },
  audio: {
    muteSounds: false,
    volume: 0.5,
  },
};
