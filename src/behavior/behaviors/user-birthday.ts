import type { BehaviorContext } from "../behavior";
import type { BehaviorDefinition } from "../behavior-definition";
import type { RegisteredBehavior } from "../behavior-engine";

const definition: BehaviorDefinition = {
  id: "lifecycle.user_birthday",
  priority: 150, // Higher than boot-greet so it intercepts boot
  weight: 10,
  cooldownMs: 0,
  action: "celebrate",
  canInterrupt: true,
};

export const UserBirthdayBehavior: RegisteredBehavior = {
  definition,
  canExecute: (context: BehaviorContext) => {
    const birthday = context.world.settings?.birthday;
    if (!birthday) return false;

    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${mm}-${dd}`;

    if (birthday !== todayStr) return false;

    // Has it already celebrated twice today?
    const memoryKey = `birthdayCelebrationCount_${todayStr}`;
    const count = (context.world.memory as any)[memoryKey] || 0;
    if (count >= 2) return false;

    return true;
  },
  execute: (context: BehaviorContext) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${mm}-${dd}`;
    
    const memoryKey = `birthdayCelebrationCount_${todayStr}`;
    const count = (context.world.memory as any)[memoryKey] || 0;

    context.setMemory({ [memoryKey]: count + 1, hasGreeted: true, wasAsleep: false });
    
    // Trigger the celebration engine for Birthday
    context.emit({ type: "TriggerCelebration", event: "Birthday" });
    
    // Make sure we snap to edge like boot-greet
    context.emit({ type: "SnapToEdge" });
  },
};
