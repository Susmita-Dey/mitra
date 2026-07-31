import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "lifecycle.boot_greet",
  priority: 100, // Very high priority when active to override sleep
  weight: 10,
  cooldownMs: 0,
  action: "wave",
  canInterrupt: true,
};

export const BootGreetBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Has she already greeted?
    if (context.memory.hasGreeted) return false;
    
    // Check if 5 minutes have passed since boot
    // For testing, developers can change this to a smaller number.
    const BOOT_DELAY_MS = 2 * 60 * 1000;
    return Date.now() - context.memory.bootTime > BOOT_DELAY_MS;
  },
  execute: (context: BehaviorContext) => {
    // Mark as greeted and no longer asleep
    context.setMemory({ hasGreeted: true, wasAsleep: false });
    
    // Wake up and greet
    context.pushEmotion("happy");
    context.setAnimation("wave");
    context.setInteraction("none");

    // "walking in" - we'll request a move-to here.
    // If she is sleeping on the edge, we can snap her to edge or move her to the center slightly.
    context.requestMovement({ type: "snap-to-edge" });
  },
};
