export type UserState = 
  | "Available"
  | "Focused"
  | "Meeting"
  | "Gaming"
  | "Watching"
  | "Away"
  | "Sleeping";

export type TimeOfDay = 
  | "Morning"
  | "Afternoon"
  | "Evening"
  | "Night"
  | "LateNight";

export interface ContextState {
  userState: UserState;
  timeOfDay: TimeOfDay;
  lastUserInteraction: number;
  isFullscreen: boolean;
  isMeetingRunning: boolean;
  isCoding: boolean;
}

export type EmotionMood = "happy" | "curious" | "sleepy" | "concerned" | "proud" | "neutral";

export interface EmotionState {
  mood: EmotionMood;
  energy: number;      // 0-100 (speed, bounciness)
  attention: number;   // 0-100 (alertness, tracking)
  reason: string;
}

export interface ProceduralAnimationState {
  eyes: "open" | "closed" | "squint" | "wide" | "sparkle" | "happy-closed" | "sad";
  mouth: "neutral" | "smile" | "grin" | "sad" | "open" | "yawn" | "smirk";
  ears: "up" | "down" | "twitch";
  tail: "still" | "wag" | "flick" | "droop" | "curl";
  posture: "stand" | "sit" | "lie-down" | "stretch" | "sleep" | "slump" | "high-five" | "thinking" | "shy" | "concerned" | "cheer";
  bodyMotion: "still" | "breathe" | "bounce" | "sway" | "shiver" | "dance" | "look-around";
  rootScale: number;
  /** Active visual props (e.g., "laptop", "umbrella", "sunglasses") */
  props?: string[];
}

export interface CompanionMemoryV2 {
  context: ContextState;
  emotion: EmotionState;
  animation: ProceduralAnimationState;
  
  // Relationship & History
  relationship: {
    playfulness: number; // 0-100
    concern: number;     // 0-100
    remindersIgnored: number;
    remindersAcknowledged: number;
  };
  
  // Track long meetings for the summary feature
  meetingTracker: {
    meetingStartTime: number | null;
    missedReminders: string[];
  };
}
