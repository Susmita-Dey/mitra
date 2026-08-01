import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.bio",
  priority: 80,
  weight: 5,
  cooldownMs: 300000,
  action: "idle",
  canInterrupt: true,
};

export const BioReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.bio?.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    // Mitra nervously asks for a bio break, holding a towel
    context.emit({ 
      type: "SetProceduralState", 
      state: { posture: "shy", eyes: "wide", mouth: "neutral", ears: "down", tail: "still", bodyMotion: "shiver", props: ["beach-towel"] } 
    });
    context.emit({ type: "SetInteraction", interaction: "reminder:bio" });
    context.emit({ type: "PlaySound", category: "alert" });
  },
};
