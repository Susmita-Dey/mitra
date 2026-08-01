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
import { createEmotionEngine } from "./core/emotion-engine";
import { createMemoryEngine } from "./memory-engine";
import { createReminderEngine } from "./reminders/reminder-engine";
import { createContextEngine } from "./core/context-engine";
import { createAnimationDirector } from "./core/animation-director";
import { createSoundManager } from "@/system/sound-manager";
import type { ContextState, ProceduralAnimationState } from "./core/types";
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
  const emotionEngine = createEmotionEngine();
  const memoryEngine   = createMemoryEngine();
  const reminderEngine = createReminderEngine();
  const timelineEngine = createTimelineEngine();
  const presenceEngine = createPresenceEngine();
  const interactionEngine = createInteractionEngine();
  const celebrationEngine = createCelebrationEngine();
  const personalityEngine = createPersonalityEngine();
  const delightEngine = createDelightEngine();
  const contextEngine = createContextEngine();
  const animationDirector = createAnimationDirector();
  const soundManager = createSoundManager();

  let currentEmotionState: import("./core/types").EmotionState = {
     mood: "neutral",
     moodDecaysAt: null,
     energy: 50,
     attention: 50,
     reason: "init"
  };
  
  let currentContext: ContextState = {
    userState: "Available",
    timeOfDay: "Afternoon",
    lastUserInteraction: Date.now(),
    isFullscreen: false,
    isMeetingRunning: false,
    isCoding: false
  };

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
  
  // Animation Director output
  let currentProceduralState: ProceduralAnimationState | null = null;
  let currentBubbleText: string | null = null;

  const getContext = (): BehaviorContext => ({
    world: currentWorldState!,
    setMemory: (update) => memoryEngine.update(update),
    emit: (intent) => {
      currentIntents.push(intent);
    }
  });

  return {
    pushEmotion(emotion: import("@/types").Emotion) {
      const updates = emotionEngine.push(emotion, currentEmotionState);
      if (updates) {
         currentEmotionState = { ...currentEmotionState, ...updates };
      }
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
      this.pushEmotion("happy");
      soundManager.playFoley("chirp"); // Play a happy purr sound
      // Force immediate tick
      this.observe();
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
        
        const updates = emotionEngine.push("happy", currentEmotionState);
        if (updates) currentEmotionState = { ...currentEmotionState, ...updates };
        animationDirector.clearSequence(`reminder:${type}`);
        
        // Force an immediate tick to clear the interaction state and push emotion
        engine.setInteraction("none");
        this.observe(); // Update currentWorldState before think()
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
        if (currentEmotionState.mood === "sleepy") {
           const updates = emotionEngine.clear();
           currentEmotionState = { ...currentEmotionState, ...updates };
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
      
      // Update Context Engine asynchronously
      contextEngine.tick(currentContext, (updates) => {
         currentContext = { ...currentContext, ...updates };
      });
      
      // Step 1 — advance emotion decay timers and reminder timers.
      emotionEngine.tick(currentEmotionState, (updates) => {
         currentEmotionState = { ...currentEmotionState, ...updates };
      });
      
      reminderEngine.tick(
        memoryEngine.get(), 
        (update) => memoryEngine.update(update), 
        currentPrefs,
        timelineEngine,
        currentContext
      );

      // Ensure reminders that timed out (ignored) or were completed are cleared from the screen
      const activeRems = memoryEngine.get().activeReminders;
      for (const [key, item] of Object.entries(activeRems)) {
        if (item.state !== "triggered") {
          animationDirector.clearSequence(`reminder:${key}`);
        }
      }

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
      
      // Step 4 - Pass everything to Animation Director
      // Find interaction intents
      let interactionId: string | null = null;
      for (const intent of currentIntents) {
         if (intent.type === "SetInteraction") {
            interactionId = intent.interaction;
            const isReminder = intent.interaction.startsWith("reminder:");
            
            if (isReminder) {
               let text = "";
               if (intent.interaction === "reminder:water") text = "💧 Time for water!";
               else if (intent.interaction === "reminder:snack") text = "🥨 Snack break!";
               else if (intent.interaction === "reminder:lunch") text = "🍽️ Eat lunch!";
               else if (intent.interaction === "reminder:stretch") text = "🤸 Stand & Stretch";
               else if (intent.interaction === "reminder:eyes") text = "👀 Rest your eyes";
               else if (intent.interaction === "reminder:dinner") text = "🍲 Dinner time!";
               else if (intent.interaction === "reminder:bio") text = "🚽 Time for a bio break!";
               
               let overrides: Partial<import("./core/types").ProceduralAnimationState> = {
                  eyes: "squint" // Rest eyes during all reminders
               };
               if (intent.interaction === "reminder:stretch") {
                 overrides.posture = "stretch";
                 overrides.eyes = "closed";
               } else if (intent.interaction === "reminder:snack" || intent.interaction === "reminder:lunch" || intent.interaction === "reminder:dinner") {
                 overrides.posture = "sit";
                 overrides.props = ["food"];
               } else if (intent.interaction === "reminder:water") {
                 overrides.props = ["mug"];
               }

               animationDirector.queueSequence({
                  id: intent.interaction,
                  priority: "Reminder",
                  speechBubble: text,
                  animationOverrides: Object.keys(overrides).length > 0 ? overrides : undefined
               });
            } else {
               let overrides: Partial<import("./core/types").ProceduralAnimationState> = {};
               if (intent.interaction === "ear-twitch") overrides.ears = "twitch";
               if (intent.interaction === "tail-flick") overrides.tail = "flick";
               if (intent.interaction === "pet") { overrides.eyes = "squint"; overrides.ears = "down"; }
               if (intent.interaction === "tickle") { overrides.bodyMotion = "dance"; overrides.mouth = "grin"; }
               if (intent.interaction === "high-five") { overrides.posture = "high-five"; overrides.mouth = "grin"; overrides.eyes = "sparkle"; overrides.tail = "wag"; }
               
               animationDirector.queueSequence({
                  id: intent.interaction,
                  priority: "Interaction",
                  animationOverrides: overrides,
                  durationMs: 2000
               });
            }
         } else if (intent.type === "Greet") {
            animationDirector.queueSequence({
              id: "greet", priority: "Interaction", speechBubble: "Hi there!", durationMs: 4000,
              animationOverrides: { posture: "stand", bodyMotion: "bounce", eyes: "sparkle" }
            });
         } else if (intent.type === "Celebrate") {
             animationDirector.queueSequence({
              id: "celebrate", priority: "Interaction", speechBubble: "Yay!", durationMs: 4000,
              animationOverrides: { posture: "stand", bodyMotion: "dance", eyes: "sparkle", tail: "wag" }
            });
         } else if (intent.type === "PlayAnimation") {
            const anim = intent.animation;
            if (anim === "blink") {
               animationDirector.queueSequence({ id: "blink", priority: "Idle", durationMs: 200, animationOverrides: { eyes: "closed" } });
            } else if (anim === "double-blink") {
               animationDirector.queueSequence({ id: "double-blink", priority: "Idle", durationMs: 400, animationOverrides: { eyes: "closed" } });
            } else if (anim === "look-around") {
               animationDirector.queueSequence({ id: "look-around", priority: "Idle", durationMs: 3000, animationOverrides: { bodyMotion: "look-around", ears: "twitch" } });
            } else if (anim === "yawn") {
               animationDirector.queueSequence({ id: "yawn", priority: "Idle", durationMs: 3000, animationOverrides: { mouth: "open", eyes: "squint", ears: "down" } });
            } else if (anim === "stretch") {
               animationDirector.queueSequence({ id: "stretch", priority: "Idle", durationMs: 4000, animationOverrides: { posture: "stretch", eyes: "closed" } });
            } else if (anim === "walk") {
               animationDirector.queueSequence({ id: "walk", priority: "Idle", durationMs: 4000, animationOverrides: { posture: "stand", bodyMotion: "bounce", tail: "wag" } });
            }
         }
      }
      
      let props: string[] = [];
      if (currentContext.isCoding) props.push("laptop");
      if (currentWorldState?.weather?.isRaining) {
        props.push("umbrella");
      }
      
      if (currentPrefs.costumes?.sunglasses) props.push("sunglasses");
      if (currentPrefs.costumes?.towel) props.push("beach-towel");
      if (currentPrefs.costumes?.mug) props.push("mug");

      animationDirector.tick(
         Date.now(),
         currentEmotionState,
         emotionEngine,
         (animState, bubbleText, interactionId) => {
             // Merge procedural props with contextual props
             const activeProps = new Set([...(animState.props || []), ...props]);
             animState.props = Array.from(activeProps);
             currentProceduralState = animState;
             currentBubbleText = bubbleText;
             if (interactionId) {
                 engine.setInteraction(interactionId as import("@/types").Interaction);
             } else if (currentBubbleText === null) {
                 engine.setInteraction("none");
             }
         }
      );
      
      // Pass to Sound Manager
      soundManager.tick(
         currentContext, 
         currentEmotionState, 
         interactionId
      );
    },

    act() {
      // Look for ChangeEmotion intents to feed to EmotionEngine, and SetProceduralState / SetBubble
      for (const intent of currentIntents) {
        if (intent.type === "ChangeEmotion") {
          const updates = emotionEngine.push(intent.emotion, currentEmotionState);
          if (updates) currentEmotionState = { ...currentEmotionState, ...updates };
        } else if (intent.type === "SetProceduralState") {
          currentProceduralState = { ...currentProceduralState, ...intent.state } as ProceduralAnimationState;
        } else if (intent.type === "SetBubble") {
          currentBubbleText = intent.text;
          // Set bubble timer if duration provided
          if (intent.duration) {
             setTimeout(() => { engine.setBubbleText(null); }, intent.duration);
          }
        }
      }

      // Execute Intents
      executeIntents(currentIntents, {
        engine,
        windowController,
        audioSystem
      });

      // Commit resolved emotion and procedural states to the CompanionEngine store.
      engine.setEmotion(currentEmotionState.mood);
      
      if (currentProceduralState) {
         engine.setProceduralState(currentProceduralState);
      }
      engine.setBubbleText(currentBubbleText);
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
