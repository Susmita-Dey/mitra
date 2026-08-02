import type { EventBus } from "./event-bus";
import type { AppPreferences, Emotion } from "@/types";

export interface AudioSystem {
  playSound(
    category: "greet" | "happy" | "sad" | "sleepy" | "curious" | "bored" | "alert" | "drink" | "chirps" | "yawns" | "stretch" | "wow" | "applause" | "smack" | "footsteps" | "idle",
    emotion?: Emotion
  ): void;
}

const soundMap: Record<string, string[]> = {
  greet: ["/sounds/dragon-studio-pop-402324.wav"],
  happy: ["/sounds/mrstokes302-goofy-laugh-sfx-verb-mrstokes302-525043.wav"],
  wow: ["/sounds/shrek_30-pop-wow-323262.wav"],
  applause: ["/sounds/miraclei-11l-applause_from_a_smal-1749174330556-355760.wav"],
  smack: ["/sounds/smack.wav"],
  sad: ["/sounds/11325622-cartoon-trombone-sound-effect-241387.wav"],
  sleepy: ["/sounds/freesound_community-yawning-6096.wav", "/sounds/dragon-studio-male-yawn-effect-376879.wav", "/sounds/pwlpl-yawning-sound-effect-521103.wav"],
  curious: ["/sounds/dragon-studio-cartoon-blinking-372481.wav"],
  bored: ["/sounds/boring.wav"],
  alert: ["/sounds/dragon-studio-notification-sound-effect-372475.wav"],
  drink: ["/sounds/freesounds123-drinking-water-sound-403454.wav", "/sounds/freesound_community-drinking-liquid-sound-96442.wav"],
  chirps: ["/sounds/dragon-studio-ding-402325.wav"], // Fallback to ding for chirps
  yawns: ["/sounds/dragon-studio-male-yawn-effect-376879.wav"],
  // stretch: ["/sounds/justsomesounds-breathing-432885.wav"],
  stretch: ["/sounds/freesound_community-yawning-6096.wav",],
  footsteps: ["/sounds/freesoundsxx-walking-on-concrete-ver-2-268513.wav"],
  idle: ["/sounds/justsomesounds-breathing-432885.wav"],
};

// Web Audio API Context
let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Pre-load all Audio objects into memory as decoded AudioBuffers to prevent play delays
const audioCache: Record<string, AudioBuffer> = {};

async function preloadSounds() {
  const ctx = getAudioContext();
  for (const cat in soundMap) {
    for (const file of soundMap[cat]) {
      try {
        const response = await fetch(file);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioCache[file] = audioBuffer;
      } catch (err) {
        console.warn(`[AudioSystem] Failed to preload sound: ${file}`, err);
      }
    }
  }
}

// Start preloading immediately in the background
preloadSounds();

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
      const buffer = audioCache[file];
      
      if (!buffer) {
        console.warn(`[AudioSystem] Sound not yet preloaded or failed: ${file}`);
        return;
      }
      
      // Apply emotional modifier to volume if applicable
      let effectiveVolume = volume;
      if (emotion === "sleepy") effectiveVolume *= 0.5;
      if (emotion === "alert") effectiveVolume = Math.min(1.0, effectiveVolume * 1.2);

      lastPlayed[category] = now;
      
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = effectiveVolume;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Handle the baked in silence for yawns/sleepy by seeking forward
      let offset = 0;
      if (category === "sleepy" || category === "yawns" || file.includes("yawn")) {
         offset = 1.5;
      }

      source.start(0, offset);
    }
  };
}
