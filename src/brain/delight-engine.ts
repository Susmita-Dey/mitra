import type { Intent, Emotion } from "@/types";
import type { CompanionMemory } from "./memory";

export interface DelightEngine {
  /**
   * Evaluate whether a delightful moment should occur this tick.
   * Returns an array of intents if a moment is triggered.
   */
  tick(timeMs: number, memory: CompanionMemory): Intent[];
}

export function createDelightEngine(): DelightEngine {
  let lastDelightTime = 0;
  // Wait at least 15 minutes between delight checks
  const DELIGHT_COOLDOWN = 15 * 60 * 1000;
  // Small probability of a delight moment occurring when eligible
  const DELIGHT_PROBABILITY = 0.005;

  return {
    tick(timeMs, memory) {
      const intents: Intent[] = [];
      const now = new Date(timeMs);
      
      // Enforce cooldown
      if (timeMs - lastDelightTime < DELIGHT_COOLDOWN) {
        return intents;
      }

      // Check probability
      if (Math.random() > DELIGHT_PROBABILITY) {
        return intents;
      }

      const day = now.getDay();
      const hours = now.getHours();
      
      // Determine what delight to show
      const rand = Math.random();
      
      if (day === 5 && hours > 15 && rand < 0.2) {
        // Celebrating Friday afternoon
        intents.push({ type: "ChangeEmotion", emotion: "happy" });
        intents.push({ type: "Celebrate" });
      } else if (day === 1 && hours < 10 && rand < 0.2) {
        // Sleepy Monday morning
        intents.push({ type: "ChangeEmotion", emotion: "sleepy" });
        intents.push({ type: "PlayAnimation", animation: "yawn" });
      } else if (rand < 0.4) {
        // Finding a flower or watching a butterfly (represented via curiosity & observe)
        intents.push({ type: "ChangeEmotion", emotion: "curious" });
        intents.push({ type: "PlayAnimation", animation: "look-around" });
        intents.push({ type: "PlaySound", category: "chirps" });
      } else if (rand < 0.6) {
        // Waving unexpectedly
        intents.push({ type: "ChangeEmotion", emotion: "happy" });
        intents.push({ type: "PlayAnimation", animation: "wave" });
        intents.push({ type: "PlaySound", category: "happy" });
      } else if (rand < 0.8) {
        // Peeking from screen edge
        intents.push({ type: "ChangeEmotion", emotion: "curious" });
        intents.push({ type: "PlayAnimation", animation: "peek" });
      } else {
        // Chasing a floating leaf (wander)
        intents.push({ type: "ChangeEmotion", emotion: "energetic" } as any);
        intents.push({ type: "PlayAnimation", animation: "walk" });
      }

      if (intents.length > 0) {
        lastDelightTime = timeMs;
      }

      return intents;
    }
  };
}
