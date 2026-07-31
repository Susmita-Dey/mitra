import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "ambient.idle",
  priority: 0,
  weight: 5,
  cooldownMs: 0,        // No cooldown — idle is always a valid fallback.
  action: "idle",
  canInterrupt: false,
};

/**
 * Idle — the baseline ambient behavior.
 * Has subtle variations to increase naturalness: ear twitches, tail flicks, sniffing.
 */
export const IdleBehavior: RegisteredBehavior = {
  definition,
  canExecute: () => true,
  execute: (context: BehaviorContext) => {
    // Add variations based on probabilities
    // The engine ticks periodically, so these chances are per-tick when idle is chosen.
    const rand = Math.random();
    let anim: import("@/types").Animation = "idle";
    
    if (rand < 0.10) {
      anim = "look-around";
    } else if (rand < 0.20) {
      anim = "ear-twitch";
    } else if (rand < 0.30) {
      anim = "tail-flick";
    } else if (rand < 0.35) {
      anim = "sniff";
    } else if (rand < 0.38) {
      anim = "yawn";
    }
    // 62% chance to just stay 'idle' (breathing)
    
    // Only dispatch PlayAnimation if we are actually changing from current to something else, 
    // or if we are pushing a one-off variation that renderer will return to idle from.
    if (context.world.character.animation !== anim || anim !== "idle") {
      context.emit({ type: "PlayAnimation", animation: anim });
    }
    
    context.emit({ type: "ChangeEmotion", emotion: "neutral" });
  },
};
