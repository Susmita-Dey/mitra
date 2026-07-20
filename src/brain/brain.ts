import type { CompanionEngine } from "@/app/companion-engine";
import type { BehaviorContext } from "@/behavior";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";
import { createBehaviorEngine } from "@/behavior/behavior-engine";
import type { EnvironmentService, EnvironmentSnapshot } from "@/system/environment";
import type { WindowController } from "@/system/window-controller";
import type { MovementIntent } from "@/types";
import { createEmotionEngine } from "./emotion-engine";

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
}

import type { EventBus } from "@/system/index";

export function createBrain(
  engine: CompanionEngine,
  environmentService?: EnvironmentService,
  windowController?: WindowController,
  _eventBus?: EventBus,
): Brain {
  const behaviorEngine = createBehaviorEngine();
  const emotionEngine  = createEmotionEngine();

  let currentSnapshot: EnvironmentSnapshot = EMPTY_SNAPSHOT;
  let pendingMovementIntent: MovementIntent | null = null;

  const getContext = (): BehaviorContext => ({
    character:   engine.getCharacter(),
    environment: currentSnapshot,
    pushEmotion: (emotion) => emotionEngine.push(emotion),
    setEmotion:  engine.setEmotion,
    setAnimation: engine.setAnimation,
    setInteraction: engine.setInteraction,
    requestMovement: (intent) => {
      pendingMovementIntent = intent;
    }
  });

  return {
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
      
      // Step 1 — advance emotion decay timers.
      emotionEngine.tick();

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

  // Use the central scheduler instead of direct setInterval
  const handle = scheduler.schedule(tick, { intervalMs: 1000, priority: 100 });
  
  // Run an immediate initial tick
  tick();

  return () => handle.cancel();
}
