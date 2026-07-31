import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.weather",
  priority: 35, // Below sleep (40), so she sleeps during the rain.
  weight: 5,
  cooldownMs: 0, // No cooldown needed since canExecute only fires on state mismatch
  action: "idle",
  canInterrupt: true,
};

export const WeatherBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const weather = context.world.weather;
    const currentInteraction = context.world.character.interaction;
    if (!weather) return false;

    // Execute if we need to set a weather interaction OR clear an old one
    const needsRain = weather.isRaining;
    const needsSunny = weather.isSunny;
    const needsCloudy = weather.isCloudy;
    
    const hasRain = currentInteraction === "weather:rain";
    const hasSunny = currentInteraction === "weather:beach";
    const hasCloudy = currentInteraction === "weather:cloudy";

    if (needsRain && !hasRain) return true;
    if (needsSunny && !hasSunny) return true;
    if (needsCloudy && !hasCloudy) return true;
    
    // If she is holding a weather prop but the weather doesn't match anymore, clear it
    if ((hasRain && !needsRain) || (hasSunny && !needsSunny) || (hasCloudy && !needsCloudy)) {
      return true;
    }

    return false;
  },
  execute: (context: BehaviorContext) => {
    const weather = context.world.weather;
    
    if (weather?.isRaining) {
      context.emit({ type: "ChangeEmotion", emotion: "sad" });
      context.emit({ type: "SetInteraction", interaction: "weather:rain" });
    } else if (weather?.isSunny) {
      context.emit({ type: "ChangeEmotion", emotion: "happy" });
      context.emit({ type: "SetInteraction", interaction: "weather:beach" });
    } else if (weather?.isCloudy) {
      context.emit({ type: "ChangeEmotion", emotion: "neutral" });
      context.emit({ type: "SetInteraction", interaction: "weather:cloudy" });
      context.emit({ type: "PlayAnimation", animation: "look-around" });
    } else {
      // Clear weather interactions
      context.emit({ type: "SetInteraction", interaction: "none" });
      context.emit({ type: "ChangeEmotion", emotion: "neutral" });
    }
  },
};
