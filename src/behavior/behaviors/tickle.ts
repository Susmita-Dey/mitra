import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "interactive.tickle",
  priority: 20, // Very high priority (interactive)
  weight: 10,
  cooldownMs: 0, 
  action: "idle",
  canInterrupt: true,
};

/**
 * TickleBehavior — Triggered immediately when the user clicks her tummy.
 */
export const TickleBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Execute if tickled within the last 1 second
    return (Date.now() - context.world.memory.lastTickle) < 1000;
  },
  execute: (context: BehaviorContext) => {
    context.emit({ type: "ChangeEmotion", emotion: "happy" });
    
    // We can just use the blink animation, or wag tail by staying happy.
    // Let's make her do a little stretch or blink
    context.emit({ type: "PlayAnimation", animation: "blink" });
    
    // Play a giggle sound (or happy chirp)
    context.emit({ type: "PlaySound", category: "happy" });
    
    // Clear the tickle flag instantly so it doesn't loop
    context.setMemory({ lastTickle: 0 });
  },
};
