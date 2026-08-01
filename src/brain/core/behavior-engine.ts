import { ContextState, EmotionState } from "./types";

export interface BehaviorEngine {
  tick(
    context: ContextState, 
    currentEmotion: EmotionState, 
    setEmotion: (e: Partial<EmotionState>) => void
  ): void;
}

export function createBehaviorEngine(): BehaviorEngine {
  return {
    tick(context, currentEmotion, setEmotion) {
      const updates: Partial<EmotionState> = {};
      let changed = false;

      // 1. Time of Day influences baseline mood and energy
      let targetEnergy = 50;
      let targetMood = currentEmotion.mood;

      if (context.timeOfDay === "Morning") {
        targetEnergy = 70;
        if (targetMood === "sleepy") targetMood = "happy"; // Waking up
      } else if (context.timeOfDay === "Afternoon") {
        targetEnergy = 90;
      } else if (context.timeOfDay === "Evening") {
        targetEnergy = 40;
      } else if (context.timeOfDay === "Night" || context.timeOfDay === "LateNight") {
        targetEnergy = 10;
        targetMood = "sleepy";
      }

      // 2. Context influences mood and attention
      let targetAttention = 0;

      if (context.userState === "Focused" || context.userState === "Meeting") {
        // If the user is busy, Mitra shouldn't be demanding attention. She should be calm.
        targetEnergy = Math.min(targetEnergy, 30);
        targetAttention = 0;
      } else if (context.userState === "Away") {
        // User is gone, Mitra is waiting or sleeping
        targetMood = "sleepy";
        targetEnergy = 10;
      } else if (context.userState === "Available") {
        targetAttention = 20; // Glancing around
        if (targetMood === "sleepy" && context.timeOfDay !== "LateNight") {
           targetMood = "curious"; // Wake up when user comes back
        }
      }

      // Apply changes if significantly different to avoid thrashing
      if (Math.abs(currentEmotion.energy - targetEnergy) > 10) {
        updates.energy = targetEnergy;
        changed = true;
      }
      if (Math.abs(currentEmotion.attention - targetAttention) > 10) {
        updates.attention = targetAttention;
        changed = true;
      }
      if (currentEmotion.mood !== targetMood) {
        updates.mood = targetMood;
        changed = true;
      }

      if (changed) {
        setEmotion(updates);
      }
    }
  };
}
