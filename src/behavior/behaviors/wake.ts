import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "reactive.wake",
  priority: 30,         // High priority — wake up immediately
  weight: 10,
  cooldownMs: 0,
  action: "observe",
  canInterrupt: true,
};

/**
 * Wake — Mitra quickly wakes up when the user returns.
 * Triggered when the memory says she was asleep, but the environment says the user is active.
 */
export const WakeBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // If we haven't greeted yet, don't wake up from normal user activity.
    // The BootGreetBehavior will handle the initial wake up.
    if (!context.world.memory.hasGreeted) return false;

    const isUserActive = !context.world.environment.idleMs || context.world.environment.idleMs < 1000;
    return context.world.memory.wasAsleep && isUserActive;
  },
  execute: (context: BehaviorContext) => {
    // Clear sleepy state and memory
    context.setMemory({ wasAsleep: false });
    context.emit({ type: "ChangeEmotion", emotion: "curious" });
    context.emit({ type: "PlayAnimation", animation: "observe" });
    context.emit({ type: "PlaySound", category: "happy" });
  },
};
