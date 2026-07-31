import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "presence.sit",
  priority: 30, // Higher than ambient, lower than reactive
  weight: 5,
  cooldownMs: 0,
  action: "sit",
  canInterrupt: true,
};

/**
 * Sit — Mitra sits down when the user is somewhat idle.
 * Driven by the PresenceEngine's "Sitting" state.
 */
export const SitBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    return context.world.presence === "Sitting";
  },
  execute: (context: BehaviorContext) => {
    if (context.world.character.animation !== "sit") {
      context.emit({ type: "PlayAnimation", animation: "sit" });
      context.emit({ type: "ChangeEmotion", emotion: "relaxed" });
    }
  },
};
