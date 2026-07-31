import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.weather",
  priority: 10, // Medium priority (between idle and battery)
  weight: 5,
  cooldownMs: 300_000, // Trigger once every 5 minutes if raining
  action: "idle",
  canInterrupt: true,
};

/**
 * WeatherBehavior — Mitra reacts to the weather (e.g. holds an umbrella if raining).
 */
export const WeatherBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const weather = context.world.weather;
    if (!weather) return false;

    // React if it is raining
    return weather.isRaining;
  },
  execute: (context: BehaviorContext) => {
    // She looks a bit bored/sad about the rain and holds an umbrella
    context.emit({ type: "ChangeEmotion", emotion: "bored" });
    context.emit({ type: "PlayAnimation", animation: "stand" });
    context.emit({ type: "SetInteraction", interaction: "weather:rain" });
    
    // Hold it for 10 seconds
    setTimeout(() => {
       // Clears on next tick
    }, 10000);
  },
};
