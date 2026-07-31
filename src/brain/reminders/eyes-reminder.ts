import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.eyes",
  priority: 80,
  weight: 5,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

export const EyesReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.memory.activeReminders.eyes.state === "triggered";
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "PlayAnimation", animation: "sit" });
    context.emit({ type: "SetInteraction", interaction: "reminder:eyes" });
    context.emit({ type: "PlaySound", category: "alert" });
  },
};
