import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.stretch",
  priority: 10,
  weight: 5,
  cooldownMs: 0,
  action: "stretch",
  canInterrupt: true,
};

export const StretchReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.stretch.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "stretch" }); 
    context.emit({ type: "SetInteraction", interaction: "reminder:stretch" });
  },
};
