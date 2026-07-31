import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.weather",
  priority: 60, // Medium priority (between idle and battery)
  weight: 5,
  cooldownMs: 0, // Persist while condition is true
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

    // React if it is raining or if it is sunny in July (month 6)
    const isJuly = new Date().getMonth() === 6;
    return weather.isRaining || (weather.isSunny && isJuly);
  },
  execute: (context: BehaviorContext) => {
    const weather = context.world.weather;
    const isJuly = new Date().getMonth() === 6;
    
    if (weather?.isRaining) {
      // She looks a bit bored/sad about the rain and holds an umbrella
      context.emit({ type: "ChangeEmotion", emotion: "bored" });
      context.emit({ type: "PlayAnimation", animation: "stand" });
      context.emit({ type: "SetInteraction", interaction: "weather:rain" });
    } else if (weather?.isSunny && isJuly) {
      // Beach sunbath mode!
      context.emit({ type: "ChangeEmotion", emotion: "happy" });
      context.emit({ type: "PlayAnimation", animation: "lie-down" });
      context.emit({ type: "SetInteraction", interaction: "weather:beach" });
    }
    
    // State persists natively until the weather changes or priority is overridden.
  },
};
