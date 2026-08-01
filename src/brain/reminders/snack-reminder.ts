import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.snack",
  priority: 80,
  weight: 5,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

export const SnackReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.snack?.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sit" });
    context.emit({ type: "SetInteraction", interaction: "reminder:snack" });
    context.emit({ type: "PlaySound", category: "alert" });
  },
};
