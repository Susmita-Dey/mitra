import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "reminder.custom",
  priority: 80, // Matches priority of other reminder behaviors
  weight: 5,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

export const CustomReminderBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const active = context.world.memory.activeReminders || {};
    // Check if any custom reminder starts with "custom_" and is "triggered"
    return Object.keys(active).some(key => key.startsWith("custom_") && active[key]?.state === "triggered");
  },
  execute: (context: BehaviorContext) => {
    const active = context.world.memory.activeReminders || {};
    const triggeredKey = Object.keys(active).find(key => key.startsWith("custom_") && active[key]?.state === "triggered");
    if (triggeredKey) {
      context.emit({ type: "SetInteraction", interaction: `reminder:${triggeredKey}` as any });
    }
  },
};
