import { EmotionState, ProceduralAnimationState } from "./types";

export interface EmotionEngine {
  tick(currentEmotion: EmotionState, setEmotion: (e: Partial<EmotionState>) => void): void;
  // Transforms high-level emotion into specific procedural joints
  deriveAnimation(emotion: EmotionState, isInteracting: boolean): ProceduralAnimationState;
}

export function createEmotionEngine(): EmotionEngine {
  return {
    tick(currentEmotion, setEmotion) {
      // Over time, energy and attention naturally decay towards neutral
      // This is a simple decay loop. BehaviorEngine will pump these values back up.
      
      let changed = false;
      const updates: Partial<EmotionState> = {};
      
      if (currentEmotion.energy > 50) {
        updates.energy = Math.max(50, currentEmotion.energy - 1);
        changed = true;
      } else if (currentEmotion.energy < 50) {
        updates.energy = Math.min(50, currentEmotion.energy + 1);
        changed = true;
      }
      
      if (currentEmotion.attention > 0) {
        updates.attention = Math.max(0, currentEmotion.attention - 2);
        changed = true;
      }

      if (changed) {
        setEmotion(updates);
      }
    },

    deriveAnimation(emotion, isInteracting) {
      // Baseline neutral state
      const anim: ProceduralAnimationState = {
        eyes: "open",
        mouth: "neutral",
        ears: "up",
        tail: "still",
        posture: "stand",
        bodyMotion: "breathe",
        rootScale: 1
      };

      if (emotion.mood === "sleepy") {
        anim.eyes = "squint";
        anim.ears = "down";
        anim.tail = "droop";
        anim.posture = "sleep";
        anim.bodyMotion = "breathe"; // slower breathing mapped in CSS
      } 
      else if (emotion.mood === "happy") {
        anim.eyes = emotion.energy > 80 ? "sparkle" : "open";
        anim.mouth = emotion.energy > 80 ? "grin" : "smile";
        anim.tail = emotion.energy > 60 ? "wag" : "flick";
        anim.ears = "up";
        anim.bodyMotion = emotion.energy > 90 ? "bounce" : "sway";
      }
      else if (emotion.mood === "concerned") {
        anim.eyes = "wide";
        anim.mouth = "sad";
        anim.ears = "down";
        anim.tail = "still";
        anim.posture = "sit";
      }
      else if (emotion.mood === "curious") {
        anim.eyes = "wide";
        anim.ears = "twitch";
        anim.tail = "flick";
        anim.posture = "stand";
      }

      // Overrides based on immediate interaction
      if (isInteracting) {
        if (emotion.mood !== "sleepy") {
          anim.ears = "twitch"; 
        }
      }

      return anim;
    }
  };
}
