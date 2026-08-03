import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.battery",
  priority: 90, // Higher than ambient/reminders
  weight: 5,
  cooldownMs: 0, 
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

    // React if battery is below 25% and NOT charging
    return battery.level <= 0.25 && !battery.charging;
  },
  execute: (context: BehaviorContext) => {
    // Show sick emotion and thermometer prop
    context.emit({ type: "ChangeEmotion", emotion: "sad" });
    context.emit({ type: "PlayAnimation", animation: "sit" });
    context.emit({ type: "ChangePhysical", state: { health: "sick", energy: "tired" } });
    // This state persists natively until battery recovers.
  },
};
