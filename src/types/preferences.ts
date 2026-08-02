export interface WindowPosition {
  x: number;
  y: number;
}

export interface ReminderConfig {
  intervalMs: number;
  jitterMs: number; // e.g. 5 minutes randomness
  time?: string; // If set (e.g. "13:00"), behaves as a clock-based reminder. intervalMs is ignored.
}

export interface ReminderPreferences {
  enabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "08:00"
  water: ReminderConfig;
  stretch: ReminderConfig;
  eyes: ReminderConfig;
  lunch: ReminderConfig;
  dinner: ReminderConfig;
  snack: ReminderConfig;
  bio: ReminderConfig;
}

export interface BehaviorPreferences {
  idleAnimations: boolean;
  wanderEnabled: boolean;
  interactionLevel: "minimal" | "normal" | "active";
  clickThrough: boolean;
  weatherLocation?: string;
  hideDuringMeetings?: boolean;
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
 * Costume/Prop state toggle preferences.
 */
export interface CostumePreferences {
  sunglasses: boolean;
  towel: boolean;
  mug: boolean;
}

/**
 * Trust and Privacy preferences.
 * States can be "unknown", "granted", "denied", "approximate" (for location), or "off".
 */
export type TrustState = "unknown" | "granted" | "denied" | "approximate" | "off";

export interface TrustPreferences {
  location: TrustState;
  microphone: TrustState;
  camera: TrustState;
  notifications: TrustState;
  accessibility: TrustState;
  autostart: TrustState;
  calendar: TrustState;
  spotify: TrustState;
  slack: TrustState;
  discord: TrustState;
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
  costumes: CostumePreferences;
  trust: TrustPreferences;
  onboardingComplete: boolean;
  userName?: string;
  birthday?: string; // Format: MM-DD
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
    lunch: { intervalMs: 0, jitterMs: 5 * 60 * 1000, time: "13:00" },
    dinner: { intervalMs: 0, jitterMs: 5 * 60 * 1000, time: "20:00" },
    snack: { intervalMs: 0, jitterMs: 5 * 60 * 1000, time: "17:00" },
    bio: { intervalMs: 2 * 60 * 60 * 1000, jitterMs: 15 * 60 * 1000 },
  },
  behavior: {
    idleAnimations: true,
    wanderEnabled: true,
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
  costumes: {
    sunglasses: false,
    towel: false,
    mug: false,
  },
  trust: {
    location: "approximate", // "unknown" | "granted" | "denied" | "approximate" | "off"
    microphone: "unknown",
    camera: "unknown",
    notifications: "unknown",
    accessibility: "unknown",
    autostart: "unknown",
    calendar: "unknown",
    spotify: "unknown",
    slack: "unknown",
    discord: "unknown",
  },
  onboardingComplete: false,
  userName: "",
};
