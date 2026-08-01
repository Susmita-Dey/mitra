import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.dinner",
  priority: 80,
  weight: 5,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

export const DinnerReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.dinner?.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sit" });
    context.emit({ type: "SetInteraction", interaction: "reminder:dinner" });
    context.emit({ type: "PlaySound", category: "alert" });
  },
};
