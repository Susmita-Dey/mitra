import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.water",
  priority: 80,         // Higher than ambient, lower than reactive
  weight: 5,
  cooldownMs: 300000,   // Wait 5 mins (matches engine timeout) before re-triggering sound
  action: "idle",       // Uses idle animation, but we render a bubble
  canInterrupt: true,
};

export const WaterReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.water.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sit" }); // Mitra sits patiently with a reminder
    context.emit({ type: "SetInteraction", interaction: "reminder:water" });
    context.emit({ type: "PlaySound", category: "alert" });
  },
};
