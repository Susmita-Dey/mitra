import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.battery",
  priority: 15, // Higher than ambient/reminders
  weight: 5,
  cooldownMs: 60_000, 
  action: "idle",
  canInterrupt: true,
};

/**
 * BatteryBehavior — Mitra reacts if the battery is dangerously low.
 */
export const BatteryBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const battery = context.world.battery;
    if (!battery || !battery.supported) return false;

    // React if battery is below 20% and NOT charging
    return battery.level <= 0.20 && !battery.charging;
  },
  execute: (context: BehaviorContext) => {
    // Show sick emotion and thermometer prop
    context.emit({ type: "ChangeEmotion", emotion: "sad" });
    context.emit({ type: "PlayAnimation", animation: "sit" });
    context.emit({ type: "SetInteraction", interaction: "state:sick" });
    // Keep it sad for 5 seconds
    setTimeout(() => {
      // It will revert back to normal idle on next tick where this behavior isn't active
    }, 5000);
  },
};
