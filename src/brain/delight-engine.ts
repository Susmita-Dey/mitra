import type { Intent } from "@/types";
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
  // Wait at least 4 hours between delight checks (per user request)
  const DELIGHT_COOLDOWN = 4 * 60 * 60 * 1000;
  // Small probability of a delight moment occurring when eligible (per tick)
  const DELIGHT_PROBABILITY = 0.01;

  return {
    tick(timeMs, _memory) {
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
      
      if (day === 5 && hours >= 15 && rand < 0.15) {
        // Celebrating Friday afternoon
        intents.push({ type: "ChangeEmotion", emotion: "excited" });
        intents.push({ type: "PlayAnimation", animation: "celebrate" });
      } else if (day === 1 && hours < 10 && rand < 0.3) {
        // Sleepy Monday morning
        intents.push({ type: "ChangeEmotion", emotion: "sleepy" });
        intents.push({ type: "PlayAnimation", animation: "yawn" });
      } else if (rand < 0.5) {
        // Sneeze (sudden micro-interaction)
        intents.push({ type: "ChangeEmotion", emotion: "bored" });
        intents.push({ type: "PlayAnimation", animation: "sneeze" });
      } else if (rand < 0.7) {
        // Finding a flower or watching a butterfly (represented via curiosity)
        intents.push({ type: "ChangeEmotion", emotion: "curious" });
        intents.push({ type: "PlayAnimation", animation: "look-around" });
        intents.push({ type: "PlaySound", category: "chirps" });
      } else if (rand < 0.85) {
        // Suddenly realizes she's sliding off and pulls herself up (represented via peek/alert)
        intents.push({ type: "ChangeEmotion", emotion: "alert" });
        intents.push({ type: "PlayAnimation", animation: "peek" });
      } else {
        // Chasing a floating leaf (wander)
        intents.push({ type: "ChangeEmotion", emotion: "energetic" });
        intents.push({ type: "PlayAnimation", animation: "walk" });
      }

      if (intents.length > 0) {
        lastDelightTime = timeMs;
      }

      return intents;
    }
  };
}
