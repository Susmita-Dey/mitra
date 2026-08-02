import { EmotionState, ProceduralAnimationState } from "./types";
import { EMOTION_DEFINITIONS } from "../emotion-definitions";
import { getCurrentLifeRhythm } from "./life-rhythm";
import { getAttachmentLevel, getAttachmentModifier } from "./attachment";
import type { Emotion } from "@/types";
import type { CompanionMemory } from "../memory";

export interface EmotionEngine {
  tick(currentEmotion: EmotionState, setEmotion: (e: Partial<EmotionState>) => void, memory: CompanionMemory): void;
  push(incoming: Emotion, currentEmotion: EmotionState): Partial<EmotionState> | null;
  clear(memory: CompanionMemory): Partial<EmotionState>;
  // Transforms high-level emotion into specific procedural joints
  deriveAnimation(emotion: EmotionState, isInteracting: boolean): ProceduralAnimationState;
}

export function createEmotionEngine(): EmotionEngine {
  return {
    tick(currentEmotion, setEmotion, memory) {
      const rhythm = getCurrentLifeRhythm();
      const attachmentLevel = getAttachmentLevel(memory);
      const attachmentModifier = getAttachmentModifier(attachmentLevel);
      
      let changed = false;
      const updates: Partial<EmotionState> = {};
      
      // Decay mood if timer expired
      if (currentEmotion.moodDecaysAt !== null && Date.now() >= currentEmotion.moodDecaysAt) {
        updates.mood = rhythm.baselineEmotion;
        
        // If New Friend and baseline is playful, override to shy
        if (attachmentLevel === "New Friend" && ["playful", "excited"].includes(updates.mood)) {
           updates.mood = "shy";
        }
        
        updates.moodDecaysAt = null;
        changed = true;
      }

      // Over time, energy and attention naturally decay towards baseline
      // BehaviorEngine will pump these values back up during interactions.
      const baselineEnergy = Math.max(0, Math.min(100, 50 + ((rhythm.energyModifier + attachmentModifier) * 50)));
      
      if (currentEmotion.energy > baselineEnergy) {
        updates.energy = Math.max(baselineEnergy, currentEmotion.energy - 1);
        changed = true;
      } else if (currentEmotion.energy < baselineEnergy) {
        updates.energy = Math.min(baselineEnergy, currentEmotion.energy + 1);
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

    push(emotion: Emotion, currentEmotion: EmotionState): Partial<EmotionState> | null {
      const incoming = EMOTION_DEFINITIONS[emotion];
      const current = EMOTION_DEFINITIONS[currentEmotion.mood];

      // Rule 1: Transition guard — is the incoming state reachable from the current one?
      if (
        incoming.allowedFrom !== "any" &&
        !incoming.allowedFrom.includes(currentEmotion.mood)
      ) {
        return null;
      }

      // Rule 2: Interruptibility — can the current emotion be displaced?
      if (!current.interruptible && incoming.priority <= current.priority) {
        return null;
      }

      // Update procedural parameters based on incoming emotion
      let energy = currentEmotion.energy;
      let attention = currentEmotion.attention;
      if (emotion === "sleepy") energy = 10;
      else if (emotion === "energetic") energy = 95;
      else if (emotion === "happy") energy = Math.max(60, energy + 20);
      else if (emotion === "focused") attention = 95;
      else if (emotion === "alert") attention = 90;

      return {
        mood: emotion,
        moodDecaysAt: incoming.decayMs !== null ? Date.now() + incoming.decayMs : null,
        energy,
        attention
      };
    },

    clear(memory: CompanionMemory): Partial<EmotionState> {
      let baseline = getCurrentLifeRhythm().baselineEmotion;
      if (getAttachmentLevel(memory) === "New Friend" && ["playful", "excited"].includes(baseline)) {
         baseline = "shy";
      }
      return {
        mood: baseline,
        moodDecaysAt: null
      };
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
      else if (emotion.mood === "bored") {
        anim.eyes = "squint";
        anim.ears = "down";
        anim.tail = "droop";
        anim.posture = "slump";
        anim.bodyMotion = "sway";
      }
      else if (emotion.mood === "calm" || emotion.mood === "cozy") {
        anim.eyes = "squint";
        anim.ears = "down";
        anim.tail = "still";
        anim.posture = "sit";
      }
      else if (emotion.mood === "playful") {
        anim.eyes = "sparkle";
        anim.mouth = "smile";
        anim.ears = "up";
        anim.tail = "wag";
        anim.posture = "stand";
      }
      else if (emotion.mood === "excited") {
        anim.eyes = "sparkle";
        anim.mouth = "grin";
        anim.ears = "up";
        anim.tail = "wag";
        anim.bodyMotion = "bounce";
        anim.posture = "stand";
      }
      else if (emotion.mood === "shy") {
        anim.eyes = "squint";
        anim.ears = "down";
        anim.tail = "still";
        anim.posture = "shy";
      }
      else if (emotion.mood === "sad") {
        anim.eyes = "sad";
        anim.mouth = "sad";
        anim.ears = "down";
        anim.tail = "still";
        anim.posture = "concerned"; // Shoulders slumped
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
