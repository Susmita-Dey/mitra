import type { Emotion } from "@/types";

export interface RhythmState {
  baselineEmotion: Emotion;
  energyModifier: number; // -1 to +1
  interruptibilityModifier: number; // -1 to +1 (e.g. less interruptible at night)
  context: "morning" | "afternoon" | "evening" | "late-night" | "weekend" | "monday-morning" | "friday-afternoon";
}

export function getCurrentLifeRhythm(weatherCondition?: string): RhythmState {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, 5 = Friday, 6 = Saturday

  let state: RhythmState = {
    baselineEmotion: "neutral",
    energyModifier: 0,
    interruptibilityModifier: 0,
    context: "afternoon"
  };

  // Base Time of Day
  if (hour >= 6 && hour < 12) {
    state.context = "morning";
    state.baselineEmotion = "energetic";
    state.energyModifier = +0.5;
    state.interruptibilityModifier = 0;
  } else if (hour >= 12 && hour < 17) {
    state.context = "afternoon";
    state.baselineEmotion = "calm";
    state.energyModifier = 0;
    state.interruptibilityModifier = 0;
  } else if (hour >= 17 && hour < 22) {
    state.context = "evening";
    state.baselineEmotion = "relaxed";
    state.energyModifier = -0.3;
    state.interruptibilityModifier = -0.2;
  } else {
    // Late Night (10 PM - 6 AM)
    state.context = "late-night";
    state.baselineEmotion = "sleepy";
    state.energyModifier = -0.8;
    state.interruptibilityModifier = -0.8; // Don't interrupt unless critical
  }

  // Day of Week Overrides
  if (day === 0 || day === 6) {
    // Weekend overrides
    state.context = "weekend";
    state.baselineEmotion = "playful";
    state.energyModifier = +0.2;
  } else if (day === 1 && hour < 12) {
    state.context = "monday-morning";
    state.baselineEmotion = "sleepy"; // Monday mornings are rough
    state.energyModifier = -0.2;
  } else if (day === 5 && hour >= 14) {
    state.context = "friday-afternoon";
    state.baselineEmotion = "excited";
    state.energyModifier = +0.4;
  }

  // Weather Overrides (if implemented)
  if (weatherCondition === "rain" || weatherCondition === "storm") {
    state.baselineEmotion = "cozy";
    state.energyModifier -= 0.2;
  }

  return state;
}
