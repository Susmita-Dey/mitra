import { ContextState, EmotionState } from "../brain/core/types";
import { createAudioSystem } from "./audio-system";

export interface SoundManager {
  tick(context: ContextState, emotion: EmotionState, activeAnimation: string | null): void;
  playFoley(type: "footsteps" | "pop" | "swish" | "chirp"): void;
}

export function createSoundManager(): SoundManager {
  const baseAudio = createAudioSystem();
  let lastPlayedAnim: string | null = null;
  let wasCoding = false;
  
  return {
    tick(context, emotion, activeAnimation) {
      // 0. Environment Transitions
      if (context.isCoding && !wasCoding) {
         baseAudio.playSound("alert", "curious");
      }
      wasCoding = context.isCoding;

      // 1. Context Awareness - Do not play ambient sounds if busy/meeting
      const isBusy = context.userState === "Meeting" || context.userState === "Focused";
      if (isBusy) return;

      // 2. Play ambient sounds occasionally based on emotion
      if (emotion.mood === "sleepy" && Math.random() < 0.001) {
        baseAudio.playSound("yawns", "sleepy");
      }
      if (emotion.mood === "happy" && Math.random() < 0.005) {
        baseAudio.playSound("chirps", "happy");
      }

      // 3. Play foley linked to animation transitions
      if (activeAnimation !== lastPlayedAnim) {
        if (activeAnimation === "walk") {
           baseAudio.playSound("footsteps");
        } else if (activeAnimation === "celebrate") {
           baseAudio.playSound("celebration");
        }
        lastPlayedAnim = activeAnimation;
      }
    },
    
    playFoley(type) {
      if (type === "footsteps") baseAudio.playSound("footsteps");
      if (type === "chirp") baseAudio.playSound("chirps");
      if (type === "pop") baseAudio.playSound("alert");
      if (type === "swish") baseAudio.playSound("idle");
    }
  };
}
