import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.lunch",
  priority: 80,
  weight: 5,
  cooldownMs: 300000,
  action: "idle",
  canInterrupt: true,
};

export const LunchReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.lunch?.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sit" });
    context.emit({ type: "SetInteraction", interaction: "reminder:lunch" });
    context.emit({ type: "PlaySound", category: "alert" });
  },
};
