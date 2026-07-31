import type { CompanionEngine } from "@/app/companion-engine";
import type { BehaviorContext } from "@/behavior";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";
import { createBehaviorEngine } from "@/behavior/behavior-engine";
import type { EnvironmentService, EnvironmentSnapshot } from "@/system/environment";
import type { WindowController } from "@/system/window-controller";
import type { AudioSystem } from "@/system/audio-system";
import { executeIntents } from "@/system/executors";
import type { BatterySystem } from "@/system/battery-system";
import type { WeatherSystem } from "@/system/weather-system";
import type { MeetingSystem } from "@/system/meeting-system";
import type { Intent, WorldState, PresenceState } from "@/types";
import { createEmotionEngine } from "./emotion-engine";
import { createMemoryEngine } from "./memory-engine";
import { createReminderEngine } from "./reminders/reminder-engine";
import type { AppPreferences } from "@/types";
import { DEFAULT_PREFERENCES } from "@/types";
import { createTimelineEngine } from "./timeline";
import { createPresenceEngine } from "./presence-engine";
import { createInteractionEngine } from "./interaction-engine";
import { createCelebrationEngine } from "./celebration-engine";
import { createPersonalityEngine } from "./personality-engine";
import { createDelightEngine } from "./delight-engine";

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
 *   1. observe() — capture a fresh EnvironmentSnapshot and construct WorldState.
 *   2. tick engines (Emotion, Reminder, Presence).
 *   3. think() — BehaviorEngine.select(WorldState) picks the winning behavior.
 *   4. act() — execute selected behavior, collect Intents, process via Executors.
 */
export interface Brain {
  registerBehavior(behavior: RegisteredBehavior): void;
  unregisterBehavior(id: string): void;
  observe(): void;
  think(): void;
  act(): void;
  pushEmotion(emotion: import("@/types").Emotion): void;
  /** Registers a user interaction to wake the companion and reset idle timers. */
  registerInteraction(): void;
  /** Acknowledges a specific reminder bubble. */
  acknowledgeReminder(id: string): void;
  /** Registers a tummy tickle. */
  registerTickle(): void;
  /** Trigger a specific companion interaction. */
  triggerInteraction(interaction: import("./interaction-engine").CompanionInteraction): void;
  /** Trigger a celebration event. */
  triggerCelebration(event: import("./celebration-engine").CelebrationEvent): void;
}

import type { EventBus } from "@/system/index";

export function createBrain(
  engine: CompanionEngine,
  environmentService?: EnvironmentService,
  windowController?: WindowController,
  audioSystem?: AudioSystem,
  batterySystem?: BatterySystem,
  weatherSystem?: WeatherSystem,
  meetingSystem?: MeetingSystem,
  eventBus?: EventBus,
): Brain {
  const behaviorEngine = createBehaviorEngine();
  const emotionEngine  = createEmotionEngine();
  const memoryEngine   = createMemoryEngine();
  const reminderEngine = createReminderEngine();
  const timelineEngine = createTimelineEngine();
  const presenceEngine = createPresenceEngine();
  const interactionEngine = createInteractionEngine();
  const celebrationEngine = createCelebrationEngine();
  const personalityEngine = createPersonalityEngine();
  const delightEngine = createDelightEngine();

  let currentPrefs = DEFAULT_PREFERENCES;
  
  if (eventBus) {
    eventBus.subscribe("preferences:updated", (prefs: any) => {
      currentPrefs = prefs as AppPreferences;
    });
  }

  let currentSnapshot: EnvironmentSnapshot = EMPTY_SNAPSHOT;
  let currentPresence: PresenceState = "Taskbar";
  let currentIntents: Intent[] = [];
  let currentWorldState: WorldState | null = null;

  const getContext = (): BehaviorContext => ({
    world: currentWorldState!,
    setMemory: (update) => memoryEngine.update(update),
    emit: (intent) => {
      currentIntents.push(intent);
    }
  });

  return {
    pushEmotion(emotion: import("@/types").Emotion) {
      emotionEngine.push(emotion);
    },

    registerBehavior(behavior: RegisteredBehavior) {
      behaviorEngine.register(behavior);
    },
    
    unregisterBehavior(id: string) {
      behaviorEngine.unregister(id);
    },

    registerInteraction() {
      memoryEngine.update({ lastUserInteraction: Date.now() });
    },

    registerTickle() {
      memoryEngine.update({ 
        lastUserInteraction: Date.now(),
        lastTickle: Date.now()
      });
      emotionEngine.push("happy");
      // Force immediate tick
      this.think();
      this.act();
    },

    acknowledgeReminder(id: string) {
      const memory = memoryEngine.get();
      const type = id as keyof typeof memory.activeReminders;
      if (memory.activeReminders[type]) {
        const active = { ...memory.activeReminders };
        active[type].state = "acknowledged";
        active[type].scheduledFor = null;
        
        const newTimeline = timelineEngine.push(
          memory.timeline, 
          "reminder:acknowledged", 
          `User acknowledged ${type}`
        );
        
        memoryEngine.update({ 
          activeReminders: active,
          lastUserInteraction: Date.now(),
          timeline: newTimeline
        });
        
        emotionEngine.push("happy");
        
        // Force an immediate tick to clear the interaction state and push emotion
        this.think();
        this.act();
      }
    },

    triggerInteraction(interaction) {
      const { intents, memoryUpdate } = interactionEngine.handleInteraction(interaction, memoryEngine.get());
      
      const adaptedPersonality = personalityEngine.adaptToInteraction(interaction, memoryEngine.get());
      const fullMemoryUpdate = { ...memoryUpdate, ...adaptedPersonality };
      
      memoryEngine.update(fullMemoryUpdate);
      currentIntents.push(...intents);
      
      const newTimeline = timelineEngine.push(
        memoryEngine.get().timeline, 
        "interaction", 
        `User triggered interaction: ${interaction}`
      );
      memoryEngine.update({ timeline: newTimeline });
      
      this.act();
    },

    triggerCelebration(event) {
      const intents = celebrationEngine.handleEvent(event);
      currentIntents.push(...intents);

      const adaptedPersonality = personalityEngine.adaptToCelebration(event, memoryEngine.get());
      
      const newTimeline = timelineEngine.push(
        memoryEngine.get().timeline, 
        "celebration", 
        `Celebration triggered: ${event}`
      );
      
      memoryEngine.update({ timeline: newTimeline, ...adaptedPersonality });

      this.act();
    },

    observe() {
      if (environmentService) {
        currentSnapshot = environmentService.getSnapshot();
      }

      // Wake up immediately if there's user activity (mouse movement/typing)
      if (memoryEngine.get().wasAsleep && currentSnapshot.idleMs < 1000) {
        memoryEngine.update({ wasAsleep: false });
        if (emotionEngine.getCurrent() === "sleepy") {
           emotionEngine.clear();
        }
      }
      
      const meetingState = meetingSystem?.getState();
      currentPresence = presenceEngine.tick(currentSnapshot, memoryEngine.get(), meetingState);
      
      currentWorldState = {
        time: Date.now(),
        environment: currentSnapshot,
        character: engine.getCharacter(),
        memory: memoryEngine.get(),
        presence: currentPresence,
        settings: currentPrefs,
        battery: batterySystem?.getState(),
        weather: weatherSystem?.getState(),
        meeting: meetingSystem?.getState(),
      };
    },

    think() {
      currentIntents = []; // Clear intents for this tick
      
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
      
      // Inject personality influence into behavior selection (by modifying context or adjusting weights inside engine)
      // For now, we adapt personality based on environment
      const envUpdate = personalityEngine.adaptToEnvironment(currentSnapshot.idleMs, memoryEngine.get());
      memoryEngine.update(envUpdate);
      
      // Step 3 — check for delight events
      const delightIntents = delightEngine.tick(Date.now(), memoryEngine.get());
      if (delightIntents.length > 0) {
        currentIntents.push(...delightIntents);
      }

      const selected = behaviorEngine.select(context);

      if (selected) {
        selected.execute(context);
        behaviorEngine.markExecuted(selected.definition.id);
      }
    },

    act() {
      // Look for ChangeEmotion intents to feed to EmotionEngine
      for (const intent of currentIntents) {
        if (intent.type === "ChangeEmotion") {
          emotionEngine.push(intent.emotion);
        }
      }

      // Execute Intents
      executeIntents(currentIntents, {
        engine,
        windowController,
        audioSystem
      });

      // Commit resolved emotion to the CompanionEngine store.
      engine.setEmotion(emotionEngine.getCurrent());
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
  
  // Run an immediate initial tick
  tick();

  return () => {
    handle.cancel();
  };
}
