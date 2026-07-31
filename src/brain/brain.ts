import type { CompanionEngine } from "@/app/companion-engine";
import type { BehaviorContext } from "@/behavior";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";
import { createBehaviorEngine } from "@/behavior/behavior-engine";
import type { EnvironmentService, EnvironmentSnapshot } from "@/system/environment";
import type { WindowController } from "@/system/window-controller";
import type { MovementIntent } from "@/types";
import { createEmotionEngine } from "./emotion-engine";
import { createMemoryEngine } from "./memory-engine";
import { createReminderEngine } from "./reminders/reminder-engine";
import type { AppPreferences } from "@/types";
import { DEFAULT_PREFERENCES } from "@/types";
import { createTimelineEngine } from "./timeline";

// A frozen empty snapshot used before the first real observation.
const EMPTY_SNAPSHOT: EnvironmentSnapshot = Object.freeze({
  mouseIdleMs: 0,
  keyboardIdleMs: 0,
  idleMs: 0,
  mouseActive: false,
  keyboardActive: false,
  windowFocused: true,
  cursorInWindow: false,
  screenWidth: 0,
  screenHeight: 0,
  devicePixelRatio: 1,
  monitorCount: null,
  capturedAt: 0,
});

/**
 * Brain — the decision layer.
 *
 * Owns both the EmotionEngine and the BehaviorEngine.
 * Accepts an optional EnvironmentService and WindowController.
 *
 * On each tick it:
 *   1. observe() — capture a fresh EnvironmentSnapshot.
 *   2. tick EmotionEngine — advance decays.
 *   3. BehaviorEngine.select() — pick the winning behavior.
 *   4. Execute that behavior via BehaviorContext.
 *   5. Process any movement intents emitted by the behavior.
 *   6. Commit resolved emotion to the CompanionEngine store.
 */
export interface Brain {
  registerBehavior(behavior: RegisteredBehavior): void;
  observe(): void;
  think(): void;
  act(): void;
  pushEmotion(emotion: import("@/types").Emotion): void;
  // Expose these for the bootstrap event listeners to interact with
  _internalMemory: ReturnType<typeof createMemoryEngine>;
  _internalTimeline: ReturnType<typeof createTimelineEngine>;
}

import type { EventBus } from "@/system/index";

export function createBrain(
  engine: CompanionEngine,
  environmentService?: EnvironmentService,
  windowController?: WindowController,
  eventBus?: EventBus,
): Brain {
  const behaviorEngine = createBehaviorEngine();
  const emotionEngine  = createEmotionEngine();
  const memoryEngine   = createMemoryEngine();
  const reminderEngine = createReminderEngine();
  const timelineEngine = createTimelineEngine();

  let currentPrefs = DEFAULT_PREFERENCES;
  
  if (eventBus) {
    eventBus.subscribe("preferences:updated", (prefs: any) => {
      currentPrefs = prefs as AppPreferences;
    });
  }

  let currentSnapshot: EnvironmentSnapshot = EMPTY_SNAPSHOT;
  let pendingMovementIntent: MovementIntent | null = null;

  const getContext = (): BehaviorContext => ({
    character:   engine.getCharacter(),
    environment: currentSnapshot,
    memory:      memoryEngine.get(),
    setMemory:   (update) => memoryEngine.update(update),
    pushEmotion: (emotion) => emotionEngine.push(emotion),
    setEmotion:  engine.setEmotion,
    setAnimation: engine.setAnimation,
    setInteraction: engine.setInteraction,
    requestMovement: (intent) => {
      pendingMovementIntent = intent;
    }
  });

  return {
    _internalMemory: memoryEngine,
    _internalTimeline: timelineEngine,

    pushEmotion(emotion: import("@/types").Emotion) {
      emotionEngine.push(emotion);
    },

    registerBehavior(behavior: RegisteredBehavior) {
      behaviorEngine.register(behavior);
    },

    observe() {
      if (environmentService) {
        currentSnapshot = environmentService.getSnapshot();
      }
    },

    think() {
      pendingMovementIntent = null; // Clear from previous tick
      
      // Step 1 — advance emotion decay timers and reminder timers.
      emotionEngine.tick();
      reminderEngine.tick(
        memoryEngine.get(), 
        (update) => memoryEngine.update(update), 
        currentPrefs,
        timelineEngine
      );

      // Step 2 — ask the BehaviorEngine for the winning behavior this tick.
      const context = getContext();
      const selected = behaviorEngine.select(context);

      if (selected) {
        selected.execute(context);
        behaviorEngine.markExecuted(selected.definition.id);
      }

      // Step 3 — Process movement intents if the brain allows it.
      // E.g., we wouldn't allow movement if the companion is "sleeping"
      // unless it's a specific override. For now, we forward valid intents.
      if (pendingMovementIntent && windowController) {
        const intent = pendingMovementIntent as MovementIntent;
        const state = engine.getCharacter();
        
        // Example Brain rule: don't move autonomously if asleep
        const isAutonomous = intent.type !== "drag";
        if (state.emotion === "sleepy" && isAutonomous) {
           // Skip movement while sleeping unless user initiated
        } else {
           switch (intent.type) {
             case "move-to":
               if (intent.animate) {
                 windowController.animateTo(intent.x, intent.y).catch(console.error);
               } else {
                 windowController.moveTo(intent.x, intent.y).catch(console.error);
               }
               break;
             case "snap-to-edge":
               windowController.snapToEdge().catch(console.error);
               break;
             case "drag":
               windowController.startDrag().catch(console.error);
               break;
           }
           // Future handling for "follow-cursor", "wander", "return-home"
           // would involve the Brain calculating the coordinates and calling moveTo/animateTo.
        }
      }

      // Step 4 — commit the resolved emotion to the CompanionEngine store.
      engine.setEmotion(emotionEngine.getCurrent());
    },

    act() {
      // Phase 3: dispatch system-level side-effects (native notifications, etc.).
    },
  };
}

/** Bootstraps the brain's perception cycle on application start. */
export function initializeBrain(brain: Brain, scheduler: import("@/system/scheduler").SchedulerService): () => void {
  const tick = () => {
    brain.observe();
    brain.think();
    brain.act();
  };

  const handle = scheduler.schedule(tick, { intervalMs: 1000, priority: 100 });
  
  // Listen for interaction events from the renderer
  const handleAck = (e: Event) => {
    const ce = e as CustomEvent;
    const memory = brain._internalMemory.get();
    const type = ce.detail.id as keyof typeof memory.activeReminders;
    if (memory.activeReminders[type]) {
      const active = { ...memory.activeReminders };
      active[type].state = "acknowledged";
      active[type].scheduledFor = null;
      
      const newTimeline = brain._internalTimeline.push(
        memory.timeline, 
        "reminder:acknowledged", 
        `User acknowledged ${type}`
      );
      
      brain._internalMemory.update({ 
        activeReminders: active,
        lastUserInteraction: Date.now(),
        timeline: newTimeline
      });
      
      brain.pushEmotion("happy"); // Organic response to acknowledgment
      
      // Force an immediate tick to clear the interaction state and push emotion
      brain.think();
      brain.act();
    }
  };
  
  const handlePointerDown = () => {
    brain._internalMemory.update({ lastUserInteraction: Date.now() });
  };

  window.addEventListener("companion:reminder:ack", handleAck);
  window.addEventListener("pointerdown", handlePointerDown);
  
  // Run an immediate initial tick
  tick();

  return () => {
    handle.cancel();
    window.removeEventListener("companion:reminder:ack", handleAck);
    window.removeEventListener("pointerdown", handlePointerDown);
  };
}
