import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.interaction",
  priority: 95, // Higher than ambient, sleep, and battery (needs to override current state temporarily)
  weight: 10,
  cooldownMs: 0,
  action: "idle",
  canInterrupt: true,
};

/**
 * InteractionBehavior — Sustains an animation triggered by an interaction.
 * Overrides ambient behaviors so the user has time to see Mitra react.
 */
export const InteractionBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const active = context.world.memory.activeInteraction;
    return active !== null && Date.now() < active.until;
  },
  execute: (context: BehaviorContext) => {
    const active = context.world.memory.activeInteraction;
    if (!active) return;
    
    // Map interaction IDs to their sustained animations
    switch (active.id) {
      case "high-five":
        context.emit({ type: "PlayAnimation", animation: "wave" });
        break;
      case "tail-flick":
      case "poke-annoyed":
        context.emit({ type: "PlayAnimation", animation: "look-around" });
        break;
      case "ear-twitch":
      case "poke-alert":
        context.emit({ type: "PlayAnimation", animation: "blink" });
        break;
      case "gentle-tap":
        context.emit({ type: "PlayAnimation", animation: "observe" });
        break;
      default:
        context.emit({ type: "PlayAnimation", animation: "idle" });
        break;
    }
  },
};
