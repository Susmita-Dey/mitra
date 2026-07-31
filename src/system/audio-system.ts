import type { EventBus } from "./event-bus";
import type { AppPreferences } from "@/types";

export interface AudioSystem {
  playSound(category: "greet" | "happy" | "sad" | "sleepy" | "curious" | "bored" | "alert" | "drink" | "celebrate"): void;
}

const soundMap: Record<string, string[]> = {
  greet: ["/sounds/dragon-studio-pop-402322.mp3", "/sounds/dragon-studio-pop-402324.mp3"],
  happy: ["/sounds/mrstokes302-goofy-laugh-sfx-verb-mrstokes302-525043.mp3"],
  celebrate: ["/sounds/shrek_30-pop-wow-323262.mp3"],
  sad: ["/sounds/11325622-cartoon-trombone-sound-effect-241387.mp3"],
  sleepy: ["/sounds/freesound_community-yawning-6096.mp3", "/sounds/dragon-studio-male-yawn-effect-376879.mp3", "/sounds/pwlpl-yawning-sound-effect-521103.mp3"],
  curious: ["/sounds/dragon-studio-cartoon-blinking-372481.mp3"],
  bored: ["/sounds/11325622-clock-ticking-sound-effect-240503.mp3"],
  alert: ["/sounds/dragon-studio-ding-402325.mp3", "/sounds/dragon-studio-notification-sound-effect-372475.mp3"],
  drink: ["/sounds/freesounds123-drinking-water-sound-403454.mp3", "/sounds/freesound_community-drinking-liquid-sound-96442.mp3"],
};

export function createAudioSystem(eventBus?: EventBus): AudioSystem {
  let isMuted = false;
  let volume = 0.5;

  if (eventBus) {
    eventBus.subscribe("preferences:updated", (prefs: AppPreferences) => {
      isMuted = prefs.audio?.muteSounds ?? false;
      volume = prefs.audio?.volume ?? 0.5;
    });
  }

  return {
    playSound(category) {
      if (isMuted) return;

      const options = soundMap[category];
      if (!options || options.length === 0) {
        console.warn(`[AudioSystem] No sounds found for category: ${category}`);
        return;
      }
      
      const file = options[Math.floor(Math.random() * options.length)];
      console.log(`[AudioSystem] Playing ${file} (Category: ${category}, Volume: ${volume})`);
      
      const audio = new Audio(file);
      audio.volume = volume;
      audio.play().catch(err => {
        // Browsers block autoplay until user interacts. 
        // This catch prevents unhandled promise rejections.
        console.warn("[AudioSystem] Could not play sound (autoplay blocked?):", err);
      });
    }
  };
}
