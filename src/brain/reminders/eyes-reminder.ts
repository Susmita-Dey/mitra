import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.eyes",
  priority: 10,
  weight: 5,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

export const EyesReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.memory.activeReminders.eyes.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.setAnimation("observe"); // Look around to remind about eyes
    context.setInteraction("reminder:eyes");
  },
};
