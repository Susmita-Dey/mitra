import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "lifecycle.mitra_birthday",
  priority: 140, // High priority, but slightly below user birthday
  weight: 10,
  cooldownMs: 0,
  action: "celebrate",
  canInterrupt: true,
};

export const MitraBirthdayBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${mm}-${dd}`;
    const yearStr = String(today.getFullYear());

    // Mitra's birthday is August 1st!
    if (todayStr !== "08-01") return false;

    // Has it already celebrated this year?
    const memoryKey = `lastMitraBirthdayCelebrated_${yearStr}`;
    if ((context.world.memory as any)[memoryKey]) return false;

    return true;
  },
  execute: (context: BehaviorContext) => {
    const today = new Date();
    const yearStr = String(today.getFullYear());
    const memoryKey = `lastMitraBirthdayCelebrated_${yearStr}`;

    context.setMemory({ [memoryKey]: true, hasGreeted: true, wasAsleep: false });
    
    context.emit({ type: "ChangeEmotion", emotion: "happy" });
    
    const name = context.world.settings?.userName?.trim();
    const greeting = name ? `${name}, today is my Birthday!! 🎂 Let's celebrate!` : `Today is my Birthday!! 🎂 Let's celebrate!`;
    
    context.emit({ type: "SetBubble", text: greeting, duration: 15000 });
    context.emit({ type: "SetProceduralState", state: { posture: "cheer", bodyMotion: "dance", eyes: "sparkle", mouth: "open", ears: "up", tail: "wag", props: ["birthday-hat", "birthday-cake"] } });
    context.emit({ type: "PlaySound", category: "happy" });
    
    context.emit({ type: "SnapToEdge" });
  },
};
