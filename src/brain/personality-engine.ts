import type { CompanionMemory } from "./memory";
import type { CompanionInteraction } from "./interaction-engine";
import type { CelebrationEvent } from "./celebration-engine";

export interface PersonalityEngine {
  /** Adapt personality traits based on an interaction */
  adaptToInteraction(interaction: CompanionInteraction, memory: CompanionMemory): Partial<CompanionMemory>;
  /** Adapt personality traits based on a celebration event */
  adaptToCelebration(event: CelebrationEvent, memory: CompanionMemory): Partial<CompanionMemory>;
  /** Adapt personality traits based on environment state (e.g. idle time) */
  adaptToEnvironment(idleMs: number, memory: CompanionMemory): Partial<CompanionMemory>;
}

const ADAPT_RATE = 0.01;
const DECAY_RATE = 0.001;

function clamp(value: number): number {
  return Math.max(0.0, Math.min(1.0, value));
}

export function createPersonalityEngine(): PersonalityEngine {
  return {
    adaptToInteraction(interaction, memory) {
      const p = { ...(memory.personality || { playful: 0.5, curious: 0.5, shy: 0.2, gentle: 0.5, energetic: 0.5, sleepy: 0.3 }) };
      
      if (interaction === "pet" || interaction === "gentle-tap") {
        p.gentle = clamp(p.gentle + ADAPT_RATE);
        p.shy = clamp(p.shy - ADAPT_RATE);
      } else if (interaction === "poke" || interaction === "drag") {
        p.shy = clamp(p.shy + ADAPT_RATE);
        p.playful = clamp(p.playful - ADAPT_RATE);
      } else if (interaction === "high-five" || interaction === "wave") {
        p.energetic = clamp(p.energetic + ADAPT_RATE);
        p.playful = clamp(p.playful + ADAPT_RATE);
      } else if (interaction === "sleep") {
        p.sleepy = clamp(p.sleepy + ADAPT_RATE);
        p.energetic = clamp(p.energetic - ADAPT_RATE);
      }

      return { personality: p };
    },

    adaptToCelebration(_event, memory) {
      // Small boost to playful and energetic when celebrating
      const p = { ...(memory.personality || { playful: 0.5, curious: 0.5, shy: 0.2, gentle: 0.5, energetic: 0.5, sleepy: 0.3 }) };
      
      p.energetic = clamp(p.energetic + ADAPT_RATE);
      p.playful = clamp(p.playful + (ADAPT_RATE / 2));
      p.sleepy = clamp(p.sleepy - ADAPT_RATE);

      return { personality: p };
    },

    adaptToEnvironment(idleMs, memory) {
      const p = { ...(memory.personality || { playful: 0.5, curious: 0.5, shy: 0.2, gentle: 0.5, energetic: 0.5, sleepy: 0.3 }) };
      
      // Decay slightly towards baseline over time
      if (idleMs > 60_000 * 60) { // 1 hour idle
        p.sleepy = clamp(p.sleepy + DECAY_RATE);
        p.energetic = clamp(p.energetic - DECAY_RATE);
      } else if (idleMs < 5000) {
        // High activity
        p.curious = clamp(p.curious + DECAY_RATE);
      }

      return { personality: p };
    }
  };
}
