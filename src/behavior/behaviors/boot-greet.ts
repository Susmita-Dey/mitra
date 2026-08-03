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
    if (context.world.memory.hasGreeted) return false;
    
    // Don't greet if onboarding is currently showing!
    if ((window as any).ONBOARDING_ACTIVE) return false;
    
    // As soon as onboarding finishes (or if already finished on startup), trigger!
    return true;
  },
  execute: (context: BehaviorContext) => {
    // Mark as greeted and no longer asleep
    context.setMemory({ hasGreeted: true, wasAsleep: false });
    
    // Wake up and greet energetically!
    context.emit({ type: "ChangeEmotion", emotion: "happy" });
    
    // Use our new procedural poses for an adorable energetic cheer!
    context.emit({ 
      type: "SetProceduralState", 
      state: { posture: "cheer", eyes: "happy-closed", mouth: "open", ears: "up", tail: "wag", bodyMotion: "bounce" } 
    });
    
    // Personalised greeting using the user's name if they set it during onboarding
    const name = context.world.settings?.userName?.trim().split(" ")[0];
    const greeting = name ? `Good to see you, ${name}! 👋` : "Good to see you! 👋";

    context.emit({ type: "SetBubble", text: greeting, duration: 4000 });
    context.emit({ type: "SetInteraction", interaction: "none" });
    
    // Play happy sound
    context.emit({ type: "PlaySound", category: "greet" });

    // "walking in" - we'll request a move-to here.
    // If she is sleeping on the edge, we can snap her to edge or move her to the center slightly.
    context.emit({ type: "SnapToEdge" });
  },
};
