import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "system.meeting",
  priority: 100, // Very high priority, overrides everything else
  weight: 100,
  cooldownMs: 0, 
  action: "idle",
  canInterrupt: true,
};

let wasHidden = false;

/**
 * MeetingHideBehavior — Hides Mitra when the user is in a meeting.
 */
export const MeetingHideBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const inMeeting = context.world.meeting?.inMeeting ?? false;
    
    // We need to execute if we ARE in a meeting (to hide), 
    // OR if we WERE hidden but the meeting ended (to show again).
    if (inMeeting && !wasHidden) return true;
    if (!inMeeting && wasHidden) return true;
    
    return false;
  },
  execute: (context: BehaviorContext) => {
    const inMeeting = context.world.meeting?.inMeeting ?? false;
    
    if (inMeeting && !wasHidden) {
      context.emit({ type: "HideWindow" });
      wasHidden = true;
    } else if (!inMeeting && wasHidden) {
      context.emit({ type: "ShowWindow" });
      wasHidden = false;
    }
  },
};
