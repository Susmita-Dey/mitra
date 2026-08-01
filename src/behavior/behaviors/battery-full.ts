import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.battery_full",
  priority: 85, // Slightly lower than low battery, but higher than ambient
  weight: 5,
  cooldownMs: 60000, // Cooldown of 60 seconds so it doesn't spam
  action: "idle",
  canInterrupt: true,
};

/**
 * BatteryFullBehavior — Mitra gets energetic and dances when the battery reaches 100%.
 */
export const BatteryFullBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const battery = context.world.battery;
    if (!battery || !battery.supported) return false;

    // React if battery is 100% and charging just hit full or remains full
    return battery.level >= 1.0;
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "ChangeEmotion", emotion: "happy" });
    context.emit({ type: "PlayAnimation", animation: "celebrate" });
    context.emit({ type: "SetInteraction", interaction: "idle" });
  },
};
