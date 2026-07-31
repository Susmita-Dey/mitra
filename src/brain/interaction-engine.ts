import type { CompanionMemory } from "./memory";
import type { Intent } from "@/types";

export type CompanionInteraction = 
  | "pet"
  | "poke"
  | "drag"
  | "wave"
  | "celebrate"
  | "sleep"
  | "wake"
  | "high-five"
  | "gentle-tap";

export interface InteractionEngine {
  /**
   * Handle an interaction, returning an array of Intents to execute immediately,
   * and a partial memory update.
   */
  handleInteraction(
    interaction: CompanionInteraction,
    memory: CompanionMemory
  ): { intents: Intent[]; memoryUpdate?: Partial<CompanionMemory> };
}

export function createInteractionEngine(): InteractionEngine {
  let petCount = 0;
  let pokeCount = 0;
  let lastPetTime = 0;
  let lastPokeTime = 0;

  return {
    handleInteraction(interaction, memory) {
      const now = Date.now();
      const intents: Intent[] = [];
      let memoryUpdate: Partial<CompanionMemory> = {
        lastUserInteraction: now,
      };

      if (interaction === "pet") {
        if (now - lastPetTime > 60_000) petCount = 0;
        petCount++;
        lastPetTime = now;
        
        if (petCount > 5) {
          intents.push({ type: "ChangeEmotion", emotion: "sleepy" });
          intents.push({ type: "PlayAnimation", animation: "yawn" });
        } else {
          intents.push({ type: "ChangeEmotion", emotion: "happy" });
          intents.push({ type: "PlayAnimation", animation: "idle" });
          intents.push({ type: "PlaySound", category: "happy" });
        }
      } else if (interaction === "poke") {
        if (now - lastPokeTime > 30_000) pokeCount = 0;
        pokeCount++;
        lastPokeTime = now;

        if (pokeCount > 3) {
          intents.push({ type: "ChangeEmotion", emotion: "concerned" });
          intents.push({ type: "PlayAnimation", animation: "look-around" });
        } else {
          intents.push({ type: "ChangeEmotion", emotion: "alert" });
          intents.push({ type: "PlayAnimation", animation: "blink" });
        }
      } else if (interaction === "gentle-tap") {
        intents.push({ type: "ChangeEmotion", emotion: "curious" });
        intents.push({ type: "PlayAnimation", animation: "observe" });
      } else if (interaction === "drag") {
        intents.push({ type: "ChangeEmotion", emotion: "concerned" });
      } else if (interaction === "wave") {
        intents.push({ type: "ChangeEmotion", emotion: "happy" });
        intents.push({ type: "Greet" }); // Emits Greet intent which handles wave
      } else if (interaction === "high-five") {
        intents.push({ type: "ChangeEmotion", emotion: "happy" });
        intents.push({ type: "PlayAnimation", animation: "wave" });
        intents.push({ type: "PlaySound", category: "happy" });
      } else if (interaction === "sleep") {
        intents.push({ type: "ChangeEmotion", emotion: "sleepy" });
        intents.push({ type: "Sleep" });
        memoryUpdate.wasAsleep = true;
      } else if (interaction === "wake") {
        intents.push({ type: "ChangeEmotion", emotion: "curious" });
        intents.push({ type: "Wake" });
        memoryUpdate.wasAsleep = false;
      } else if (interaction === "celebrate") {
        intents.push({ type: "ChangeEmotion", emotion: "happy" });
        intents.push({ type: "Celebrate" });
      }

      return { intents, memoryUpdate };
    }
  };
}
