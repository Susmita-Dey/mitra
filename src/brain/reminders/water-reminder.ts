import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.water",
  priority: 10,         // Higher than ambient, lower than reactive
  weight: 5,
  cooldownMs: 0,
  action: "idle",       // Uses idle animation, but we render a bubble
  canInterrupt: true,
};

export const WaterReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.memory.activeReminders.water.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.setAnimation("sit"); // Mitra sits patiently with a reminder
    context.setInteraction("reminder:water");
  },
};
