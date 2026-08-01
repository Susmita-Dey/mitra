import type { EventBus } from "./event-bus";
import type { AppPreferences, Emotion } from "@/types";

export interface AudioSystem {
  playSound(
    category: "greet" | "happy" | "sad" | "sleepy" | "curious" | "bored" | "alert" | "drink" | "chirps" | "yawns" | "stretch" | "celebration" | "footsteps" | "idle",
    emotion?: Emotion
  ): void;
}

const soundMap: Record<string, string[]> = {
  greet: ["/sounds/dragon-studio-pop-402322.mp3", "/sounds/dragon-studio-pop-402324.mp3"],
  happy: ["/sounds/mrstokes302-goofy-laugh-sfx-verb-mrstokes302-525043.mp3", "/sounds/happy-variation.mp3"],
  celebration: ["/sounds/shrek_30-pop-wow-323262.mp3", "/sounds/celebration-fanfare.mp3"],
  sad: ["/sounds/11325622-cartoon-trombone-sound-effect-241387.mp3"],
  sleepy: ["/sounds/freesound_community-yawning-6096.mp3", "/sounds/dragon-studio-male-yawn-effect-376879.mp3", "/sounds/pwlpl-yawning-sound-effect-521103.mp3"],
  curious: ["/sounds/dragon-studio-cartoon-blinking-372481.mp3"],
  bored: ["/sounds/11325622-clock-ticking-sound-effect-240503.mp3"],
  alert: ["/sounds/dragon-studio-ding-402325.mp3", "/sounds/dragon-studio-notification-sound-effect-372475.mp3"],
  drink: ["/sounds/freesounds123-drinking-water-sound-403454.mp3", "/sounds/freesound_community-drinking-liquid-sound-96442.mp3"],
  chirps: ["/sounds/ambient-chirp-1.mp3", "/sounds/ambient-chirp-2.mp3"],
  yawns: ["/sounds/freesound_community-yawning-6096.mp3", "/sounds/dragon-studio-male-yawn-effect-376879.mp3"],
  stretch: ["/sounds/stretch-creak.mp3"],
  footsteps: ["/sounds/step-1.mp3", "/sounds/step-2.mp3"],
  idle: ["/sounds/soft-ambient-breath.mp3"],
};

// Pre-load all Audio objects into memory to prevent play delays
const audioCache: Record<string, HTMLAudioElement> = {};
for (const cat in soundMap) {
  soundMap[cat].forEach(file => {
    const audio = new Audio(file);
    audio.preload = "auto";
    audioCache[file] = audio;
  });
}

export function createAudioSystem(eventBus?: EventBus): AudioSystem {
  let isMuted = false;
  let volume = 0.5;
  let quietHoursStart = "22:00";
  let quietHoursEnd = "08:00";
  
  // Anti-repetition state
  const lastPlayed: Record<string, number> = {};
  const cooldowns: Record<string, number> = {
    chirps: 300_000, // 5 minutes
    idle: 600_000, // 10 minutes
    yawns: 120_000, // 2 minutes
    footsteps: 500, // short cooldown
    default: 10_000 // 10 seconds for others
  };

  if (eventBus) {
    eventBus.subscribe("preferences:updated", (prefs: AppPreferences) => {
      isMuted = prefs.audio?.muteSounds ?? false;
      volume = prefs.audio?.volume ?? 0.5;
      if (prefs.reminders) {
        quietHoursStart = prefs.reminders.quietHoursStart || "22:00";
        quietHoursEnd = prefs.reminders.quietHoursEnd || "08:00";
      }
    });
  }
  
  const isQuietHours = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = quietHoursStart.split(":").map(Number);
    const startMinutes = (startH || 22) * 60 + (startM || 0);
    
    const [endH, endM] = quietHoursEnd.split(":").map(Number);
    const endMinutes = (endH || 8) * 60 + (endM || 0);
    
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Crosses midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  };

  return {
    playSound(category, emotion) {
      if (isMuted) return;
      if (isQuietHours()) return;

      const now = Date.now();
      const cooldown = cooldowns[category] || cooldowns.default;
      
      // Cooldown check to prevent repetition
      if (lastPlayed[category] && now - lastPlayed[category] < cooldown) {
        return;
      }

      const options = soundMap[category];
      if (!options || options.length === 0) {
        console.warn(`[AudioSystem] No sounds found for category: ${category}`);
        return;
      }
      
      const file = options[Math.floor(Math.random() * options.length)];
      
      // Apply emotional modifier to volume if applicable
      let effectiveVolume = volume;
      if (emotion === "sleepy") effectiveVolume *= 0.5;
      if (emotion === "alert") effectiveVolume = Math.min(1.0, effectiveVolume * 1.2);

      
      
      lastPlayed[category] = now;
      
      const audio = audioCache[file] || new Audio(file);
      
      // Clone the node so we can play overlapping sounds if needed
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = effectiveVolume;
      
      // Handle the baked in silence for yawns/sleepy by seeking forward
      if (category === "sleepy" || category === "yawns" || file.includes("yawn")) {
        clone.addEventListener("loadedmetadata", () => {
          clone.currentTime = 1.5;
        });
        // If it's already loaded (because of cache), set it directly
        if (clone.readyState >= 1) {
           clone.currentTime = 1.5;
        }
      }
      
      clone.play().catch(err => {
        console.warn("[AudioSystem] Could not play sound (autoplay blocked?):", err);
      });
    }
  };
}
