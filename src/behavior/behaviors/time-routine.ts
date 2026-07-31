import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.time",
  priority: 2, // Low priority ambient modifier
  weight: 5,
  cooldownMs: 120_000, // Trigger every couple minutes
  action: "idle",
  canInterrupt: false,
};

/**
 * TimeRoutineBehavior — Mitra reacts to the time of day.
 * - Late at night (11 PM - 5 AM): gets sleepy and yawns.
 * - Early morning (6 AM - 8 AM): stretches, happy.
 */
export const TimeRoutineBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Only execute if mostly idle
    if (context.world.character.animation !== "idle") return false;
    
    const hour = new Date(context.world.time).getHours();
    
    // Night time (11 PM to 4 AM)
    if (hour >= 23 || hour <= 4) return true;
    
    // Early morning (6 AM to 8 AM)
    if (hour >= 6 && hour <= 8) return true;

    return false;
  },
  execute: (context: BehaviorContext) => {
    const hour = new Date(context.world.time).getHours();
    
    if (hour >= 23 || hour <= 4) {
      context.emit({ type: "ChangeEmotion", emotion: "sleepy" });
      context.emit({ type: "PlayAnimation", animation: "yawn" });
    } else if (hour >= 6 && hour <= 8) {
      context.emit({ type: "ChangeEmotion", emotion: "happy" });
      context.emit({ type: "PlayAnimation", animation: "stretch" });
    }
  },
};
