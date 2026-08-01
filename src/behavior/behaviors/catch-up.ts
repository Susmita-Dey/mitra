import type { BehaviorContext } from "@/behavior";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";

const definition: BehaviorDefinition = {
  id: "lifecycle.catch_up",
  priority: 95, // Almost as high as boot greet
  weight: 10,
  cooldownMs: 0,
  action: "wave",
  canInterrupt: true,
};

export const CatchUpBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    // Only execute if we have missed reminders pending and we are not currently hidden
    if ((window as any).IS_HIDDEN) return false;
    if (context.world.memory.meetingTracker.missedReminders.length === 0) return false;
    
    return true;
  },
  execute: (context: BehaviorContext) => {
    const missed = [...context.world.memory.meetingTracker.missedReminders];
    
    // Clear the missed reminders
    const updatedTracker = { ...context.world.memory.meetingTracker, missedReminders: [] };
    context.setMemory({ meetingTracker: updatedTracker });
    
    // Construct the summary string
    // e.g. ["water", "water", "bio", "stretch"] -> "2 water, 1 bio, 1 stretch"
    const counts: Record<string, number> = {};
    for (const r of missed) {
      counts[r] = (counts[r] || 0) + 1;
    }
    
    const parts = Object.entries(counts).map(([type, count]) => {
      if (type === "water") return `${count} sip${count > 1 ? 's' : ''} of water`;
      if (type === "bio") return `${count} bio break${count > 1 ? 's' : ''}`;
      if (type === "stretch") return `${count} stretch${count > 1 ? 'es' : ''}`;
      if (type === "eyes") return `${count} eye break${count > 1 ? 's' : ''}`;
      return `${count} ${type}`;
    });
    
    const summary = parts.length > 1 
      ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1]
      : parts[0];

    // Wake up and greet
    context.emit({ type: "ChangeEmotion", emotion: "happy" });
    
    // Procedural pose for welcoming back
    context.emit({ 
      type: "SetProceduralState", 
      state: { posture: "cheer", eyes: "wide", mouth: "smile", ears: "up", tail: "wag", bodyMotion: "bounce" } 
    });
    
    // The Catch-up bubble
    const text = `Welcome back! 🐾 While you were busy, you missed ${summary}. Make sure to catch up!`;
    context.emit({ type: "SetBubble", text, duration: 8000 });
    context.emit({ type: "SetInteraction", interaction: "none" });
    
    context.emit({ type: "PlaySound", category: "celebration" });
    context.emit({ type: "SnapToEdge" });
  },
};
