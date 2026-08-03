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

export interface EmotionState {
  mood: import("@/types").Emotion;
  moodDecaysAt: number | null;
  energy: number;      // 0-100 (speed, bounciness)
  attention: number;   // 0-100 (alertness, tracking)
  reason: string;
}

export interface ProceduralAnimationState {
  eyes: "open" | "closed" | "squint" | "wide" | "sparkle" | "happy-closed" | "sad" | "crescent";
  mouth: "neutral" | "smile" | "grin" | "sad" | "open" | "yawn" | "smirk" | "laugh" | "chew";
  ears: "up" | "down" | "twitch";
  tail: "still" | "wag" | "flick" | "droop" | "curl";
  posture: "stand" | "sit" | "lie-down" | "stretch" | "sleep" | "slump" | "high-five" | "thinking" | "shy" | "concerned" | "cheer" | "holding-prop" | "offering-prop" | "eating" | "satisfied";
  bodyMotion: "still" | "breathe" | "bounce" | "sway" | "shiver" | "dance" | "look-around" | "wave" | "chew";
  rootScale: number;
  /** Active visual props (e.g., "laptop", "umbrella", "sunglasses") */
  props?: string[];
}

export interface PhysicalState {
  health: "healthy" | "recovering" | "sick";
  energy: "energetic" | "tired" | "sleepy";
  behavior: "idle" | "sleeping" | "eating" | "walking" | "stretching";
}

export interface CompanionMemoryV2 {
  context: ContextState;
  physical: PhysicalState;
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
