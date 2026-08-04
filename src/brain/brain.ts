import type { CompanionEngine } from "@/app/companion-engine";
import type { AppStorage } from "@/storage/app-storage";
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
import { getReminderChain } from "@/behavior/chains/behavior-chains";

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
  /**
   * DEV/DEBUG ONLY: Force a reminder to trigger immediately.
   */
  debugForceReminder(type: string): void;
  /** Trigger a specific companion interaction. */
  triggerInteraction(interaction: import("./interaction-engine").CompanionInteraction): void;
  /** Trigger a celebration event. */
  triggerCelebration(event: import("./celebration-engine").CelebrationEvent): void;
  /** Custom helper to show text bubble */
  showCustomBubble(text: string, duration?: number): void;
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
  appStorage?: AppStorage,
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
  
  let currentPhysical: import("./core/types").PhysicalState = {
    health: "healthy",
    energy: "energetic",
    behavior: "idle"
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
  let currentTempEmotion: import("@/types").Emotion | null = null;

  // ── Reentrancy guard ────────────────────────────────────────────────────
  //
  // The scheduler fires observe → think → act every 1 s. Several Brain API
  // methods (acknowledgeReminder, triggerInteraction, etc.) also call the
  // same cycle synchronously to produce immediate feedback.
  //
  // In production, the scheduler's microtask can overlap with one of these
  // inline calls, causing the intent array to be processed twice and
  // triggering duplicate IPC commands. The guard below makes the cycle
  // non-reentrant: if a tick is already running, the caller is skipped and
  // the next scheduled tick will handle the updated state.
  // ---------------------------------------------------------------------------
  let ticking = false;

  const safeTick = () => {
    if (ticking) return;
    ticking = true;
    try {
      brainInstance.observe();
      brainInstance.think();
      brainInstance.act();
    } finally {
      ticking = false;
    }
  };

  const getContext = (): BehaviorContext => ({
    world: currentWorldState!,
    setMemory: (update) => memoryEngine.update(update),
    emit: (intent) => {
      currentIntents.push(intent);
    }
  });

  // brainInstance is assigned by the return statement below so safeTick can
  // reference it before the object literal is complete.
  let brainInstance: Brain;

  return (brainInstance = {
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
      // Use safeTick to avoid reentrant overlap with the scheduler.
      safeTick();
    },

    debugForceReminder(type: string) {
      const active = memoryEngine.get().activeReminders;
      if (active[type as keyof typeof active]) {
        // Manually inject a triggered state directly into memory, bypassing the reminder engine timer
        const updates: any = {};
        updates[type] = {
           ...active[type as keyof typeof active],
           state: "triggered",
           scheduledFor: Date.now()
        };
        // Also reset lastUserInteraction to bypass the 30s interaction cooldown check in reminderEngine
        memoryEngine.update({
          activeReminders: { ...active, ...updates },
          lastUserInteraction: Date.now() - 60_000 // 60s ago = no cooldown
        });
        
        // Use safeTick to avoid reentrant overlap with the scheduler.
        safeTick();
      }
    },

    acknowledgeReminder(id: string) {
      const memory = memoryEngine.get();
      
      if (id.startsWith("custom_")) {
        if (memory.activeReminders[id]) {
          const active = { ...memory.activeReminders };
          active[id].state = "acknowledged";
          active[id].scheduledFor = null;
          
          const newTimeline = timelineEngine.push(
            memory.timeline, 
            "reminder:acknowledged", 
            `User acknowledged custom reminder ${id}`
          );

          memoryEngine.update({ 
            activeReminders: active,
            lastUserInteraction: Date.now(),
            timeline: newTimeline
          });

          // If countdown/one-shot custom reminder, remove from preferences
          if (appStorage && currentPrefs.customReminders) {
            const customRem = currentPrefs.customReminders.find(r => r.id === id);
            if (customRem && customRem.countdownMs) {
              const updatedCustom = currentPrefs.customReminders.filter(r => r.id !== id);
              appStorage.update({ customReminders: updatedCustom }).catch(console.error);
            }
          }

          const updates = emotionEngine.push("happy", currentEmotionState);
          if (updates) currentEmotionState = { ...currentEmotionState, ...updates };

          animationDirector.clearSequence(id.startsWith("reminder:") ? id : `reminder:${id}`);
          engine.setInteraction("none");
          engine.setBubbleText(null);
          safeTick();
          return;
        }
      }

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
        
        const habits = { ...memory.habitTracker };
        const today = new Date().toISOString().split('T')[0];
        
        habits.lifetimeAcknowledged++;
        
        if (habits.lastActiveDate !== today) {
          // New day rollover
          habits.waterYesterday = habits.waterToday;
          habits.stretchYesterday = habits.stretchToday;
          habits.eyesYesterday = habits.eyesToday;
          habits.waterToday = 0;
          habits.stretchToday = 0;
          habits.eyesToday = 0;
          habits.lastActiveDate = today;
        }

        let shouldCelebrate = false;
        let milestoneMessage = "";
        
        if (type === 'water') {
          habits.waterToday++;
          if ([1, 3, 5, 8].includes(habits.waterToday)) {
            shouldCelebrate = true;
            milestoneMessage = `Yay! That's glass #${habits.waterToday} of water today! 💧`;
          }
        }
        if (type === 'stretch') {
          habits.stretchToday++;
          if ([1, 2, 4].includes(habits.stretchToday)) {
            shouldCelebrate = true;
            const suffix = habits.stretchToday === 1 ? '1st' : habits.stretchToday === 2 ? '2nd' : '4th';
            milestoneMessage = `Great job doing your ${suffix} stretch today! 🧘`;
          }
        }
        if (type === 'eyes') {
          habits.eyesToday++;
          if ([1, 2, 4].includes(habits.eyesToday)) {
            shouldCelebrate = true;
            const suffix = habits.eyesToday === 1 ? '1st' : habits.eyesToday === 2 ? '2nd' : '4th';
            milestoneMessage = `Nice! That's your ${suffix} eye break today! 👀`;
          }
        }
        
        memoryEngine.update({ 
          activeReminders: active,
          lastUserInteraction: Date.now(),
          timeline: newTimeline,
          habitTracker: habits
        });
        
        if (shouldCelebrate) {
          this.triggerCelebration("ReminderAcknowledged");
          currentIntents.push({ type: "SetBubble", text: milestoneMessage, duration: 5000 });
        } else {
          const updates = emotionEngine.push("happy", currentEmotionState);
          if (updates) currentEmotionState = { ...currentEmotionState, ...updates };
        }
        
        animationDirector.clearSequence(`reminder:${type}`);

        // Use safeTick to avoid reentrant overlap with the scheduler.
        engine.setInteraction("none");
        engine.setBubbleText(null);
        safeTick();
      }
    },

    triggerInteraction(interaction) {
      const { intents, memoryUpdate } = interactionEngine.handleInteraction(interaction, memoryEngine.get());
      
      const adaptedPersonality = personalityEngine.adaptToInteraction(interaction, memoryEngine.get());
      const fullMemoryUpdate = { ...memoryUpdate, ...adaptedPersonality };
      
      memoryEngine.update(fullMemoryUpdate);
      // Pre-load these intents so think() will pick them up alongside behavior intents
      currentIntents.push(...intents);
      
      const newTimeline = timelineEngine.push(
        memoryEngine.get().timeline, 
        "interaction", 
        `User triggered interaction: ${interaction}`
      );
      memoryEngine.update({ timeline: newTimeline });

      // Use safeTick to avoid reentrant overlap with the scheduler.
      safeTick();
    },

    triggerCelebration(event) {
      const intents = celebrationEngine.handleEvent(event);
      currentIntents.push(...intents);

      const adaptedPersonality = personalityEngine.adaptToInteraction(event as any, memoryEngine.get());
      
      const newTimeline = timelineEngine.push(
        memoryEngine.get().timeline, 
        "celebration", 
        `Celebration triggered: ${event}`
      );
      
      memoryEngine.update({ timeline: newTimeline, ...adaptedPersonality });

      // Use safeTick rather than this.act() alone — ensures observe/think also
      // run so the celebration intents are processed with fresh world state.
      safeTick();
    },

    showCustomBubble(text, duration) {
      if (text === null) {
        animationDirector.clearSequence("custom-speech-bubble");
        engine.setBubbleText(null);
      } else {
        currentIntents.push({ type: "SetBubble", text, duration });
        const updates = emotionEngine.push("happy", currentEmotionState);
        if (updates) currentEmotionState = { ...currentEmotionState, ...updates };
      }
      safeTick();
    },

    observe() {
      if (environmentService) {
        currentSnapshot = environmentService.getSnapshot();
      }

      // Wake up immediately if there's user activity (mouse movement/typing)
      if (currentSnapshot.idleMs < 1000) {
        if (memoryEngine.get().wasAsleep) {
          memoryEngine.update({ wasAsleep: false });
          if (currentEmotionState.mood === "sleepy") {
             const updates = emotionEngine.clear(memoryEngine.get());
             currentEmotionState = { ...currentEmotionState, ...updates };
          }
        }
        animationDirector.cancelAnticipation();
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
      // Update Context Engine — now synchronous, reads MeetingSystem state directly.
      // No longer issues its own IPC calls or fires unordered async promises.
      contextEngine.tick(currentContext, (updates) => {
         currentContext = { ...currentContext, ...updates };
      }, meetingSystem?.getState());
      
      // Step 1 — advance emotion decay timers and reminder timers.
      emotionEngine.tick(currentEmotionState, (updates) => {
         currentEmotionState = { ...currentEmotionState, ...updates };
      }, memoryEngine.get());
      
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
      
      // Step 3.5 - Expand TriggerCelebration intents
      const expandedIntents: Intent[] = [];
      for (const intent of currentIntents) {
         if (intent.type === "TriggerCelebration") {
            const cIntents = celebrationEngine.handleEvent(intent.event as any);
            
            // Enrich birthday message with age and user's name
            if (intent.event === "Birthday") {
               const birthday = currentPrefs.birthday;
               let ageText = "";
               if (birthday) {
                  const parts = birthday.split("-");
                  if (parts.length === 3) {
                     const birthYear = parseInt(parts[0], 10);
                     if (!isNaN(birthYear)) {
                        const currentYear = new Date().getFullYear();
                        const age = currentYear - birthYear;
                        if (age > 0) {
                           const suffix = (a: number) => {
                              const j = a % 10;
                              const k = a % 100;
                              if (j === 1 && k !== 11) return "st";
                              if (j === 2 && k !== 12) return "nd";
                              if (j === 3 && k !== 13) return "rd";
                              return "th";
                           };
                           ageText = ` ${age}${suffix(age)}`;
                        }
                     }
                  }
               }
               
               const name = currentPrefs.userName?.trim().split(" ")[0];
               const greetingName = name ? `, ${name}` : "";
               for (const ci of cIntents) {
                  if (ci.type === "SetBubble") {
                     ci.text = `HAPPY${ageText} BIRTHDAY${greetingName}!! Let's eat cake! 🎂`;
                  }
               }
            }
            
            expandedIntents.push(...cIntents);
            const adaptedPersonality = personalityEngine.adaptToCelebration(intent.event as any, memoryEngine.get());
            memoryEngine.update({ ...adaptedPersonality });
         } else {
            expandedIntents.push(intent);
         }
      }
      currentIntents = expandedIntents;
      
      // Step 4 - Pass everything to Animation Director
      // Find interaction intents
      let interactionId: string | null = null;
      for (const intent of currentIntents) {
         if (intent.type === "SetInteraction") {
            interactionId = intent.interaction;
            const isReminder = intent.interaction.startsWith("reminder:");
                        if (isReminder) {
                let chain;
                if (intent.interaction.startsWith("reminder:custom_")) {
                  const customId = intent.interaction.substring("reminder:".length);
                  const customRem = currentPrefs.customReminders?.find(r => r.id === customId);
                  const rType = customRem?.type || "other";
                  const rLabel = customRem?.label || "Reminder!";
                  chain = getCustomReminderChain(rType, rLabel);
                } else {
                  chain = getReminderChain(intent.interaction, currentContext.timeOfDay);
                }
                animationDirector.queueSequence({
                   id: intent.interaction,
                   priority: "Reminder",
                   steps: chain
                });
             } else {
               let overrides: Partial<import("./core/types").ProceduralAnimationState> = {};
               if (intent.interaction === "ear-twitch") overrides.ears = "twitch";
               if (intent.interaction === "tail-flick") { overrides.tail = "wag"; overrides.posture = "shy"; overrides.eyes = "wide"; }
               if (intent.interaction === "pet") { overrides.eyes = "squint"; overrides.ears = "down"; }
               if (intent.interaction === "tickle") { overrides.bodyMotion = "bounce"; overrides.mouth = "laugh"; overrides.eyes = "happy-closed"; overrides.ears = "twitch"; }
               if (intent.interaction === "high-five") { overrides.posture = "high-five"; overrides.bodyMotion = "bounce"; overrides.mouth = "smile"; overrides.eyes = "happy-closed"; overrides.ears = "up"; }
               
               animationDirector.queueSequence({
                  id: intent.interaction,
                  priority: "Interaction",
                  animationOverrides: overrides,
                  durationMs: intent.interaction === "high-five" ? 3500 : 2000,
                  speechBubble: intent.interaction === "high-five" ? "High-Five! 🙌" : undefined
               });
            }
         } else if (intent.type === "Greet") {
            animationDirector.queueSequence({
              id: "greet", priority: "Interaction", speechBubble: "Hi there!", durationMs: 4000,
              animationOverrides: { posture: "stand", bodyMotion: "wave", eyes: "sparkle" }
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
         } else if (intent.type === "SetBubble") {
            animationDirector.queueSequence({
               id: "custom-speech-bubble",
               priority: "Interaction",
               speechBubble: intent.text,
               durationMs: intent.duration || 4000
            });
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

      let prevBubbleText = currentBubbleText;

      animationDirector.tick(
         Date.now(),
         currentEmotionState,
         emotionEngine,
         (animState, bubbleText, interactionId, tempEmotion) => {
             // Merge procedural props with contextual props
             const activeProps = new Set([...(animState.props || []), ...props]);
             animState.props = Array.from(activeProps);
             currentProceduralState = animState;
             currentBubbleText = bubbleText;
             currentTempEmotion = tempEmotion;
             // Note: energy and attention are committed in act() via batchUpdate()
             // to avoid a premature React re-render here during think().
             if (interactionId) {
                 engine.setInteraction(interactionId as import("@/types").Interaction);
             } else if (currentBubbleText === null) {
                 engine.setInteraction("none");
             }
         },
         (soundCategory) => {
             currentIntents.push({ type: "PlaySound", category: soundCategory as any });
         }
      );
      
      if (prevBubbleText === null && currentBubbleText !== null) {
          // A new bubble just popped up!
          currentIntents.push({ type: "PlaySound", category: "alert" });
      }
      
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
        } else if (intent.type === "ChangePhysical") {
          currentPhysical = { ...currentPhysical, ...intent.state };
        }
      }

      // Execute Intents
      executeIntents(currentIntents, {
        engine,
        windowController,
        audioSystem
      });

      // Commit all resolved states to the CompanionEngine in ONE atomic batch.
      // Previously 6 separate setter calls → up to 6 React re-renders/second.
      // batchUpdate() calls patch() once → at most 1 re-render per brain tick.
      const resolvedEmotion = currentTempEmotion || currentEmotionState.mood;
      engine.batchUpdate({
        emotion: resolvedEmotion,
        physical: currentPhysical,
        ...(currentProceduralState ? { proceduralState: currentProceduralState } : {}),
        bubbleText: currentBubbleText,
        energy: currentEmotionState.energy,
        attention: currentEmotionState.attention,
      });
      
      // Clear intents after execution so next tick starts fresh
      currentIntents = [];
    },
  });
}

/** Bootstraps the brain's perception cycle on application start. */
export function initializeBrain(brain: Brain, scheduler: import("@/system/scheduler").SchedulerService): () => void {
  // Inline reentrancy guard for the scheduler tick — prevents the 1-second
  // interval from overlapping with a manually triggered safeTick() inside
  // the Brain (e.g. from acknowledgeReminder or triggerInteraction).
  let schedulerTicking = false;

  const tick = () => {
    if (schedulerTicking) return;
    schedulerTicking = true;
    try {
      brain.observe();
      brain.think();
      brain.act();
    } finally {
      schedulerTicking = false;
    }
  };

  const handle = scheduler.schedule(tick, { intervalMs: 1000, priority: 100 });

  // Run an immediate initial tick
  tick();

  return () => {
    handle.cancel();
  };
}

function getCustomReminderChain(type: string, label: string): import("@/behavior/chains/behavior-chains").BehaviorChain {
  const message = label;
  switch (type) {
    case "medicine":
      return [
        { durationMs: 1500, animationOverrides: { bodyMotion: "look-around", ears: "twitch" }, emotion: "concerned" },
        { durationMs: 0, animationOverrides: { props: ["thermometer"], eyes: "squint" }, speechBubble: message, emotion: "concerned" }
      ];
    case "posture":
      return [
        { durationMs: 2000, animationOverrides: { posture: "stretch", eyes: "closed" }, emotion: "calm" },
        { durationMs: 0, animationOverrides: { posture: "sit", eyes: "squint" }, speechBubble: message, emotion: "caring" }
      ];
    case "coffee":
      return [
        { durationMs: 1500, animationOverrides: { bodyMotion: "look-around", ears: "up" }, emotion: "happy" },
        { durationMs: 0, animationOverrides: { props: ["mug"], eyes: "squint" }, speechBubble: message, emotion: "happy" }
      ];
    case "coding break":
      return [
        { durationMs: 1500, animationOverrides: { props: ["laptop"], eyes: "squint" }, emotion: "curious" },
        { durationMs: 0, animationOverrides: { eyes: "happy-closed", mouth: "smile" }, speechBubble: message, emotion: "caring" }
      ];
    case "meetings":
      return [
        { durationMs: 1500, animationOverrides: { ears: "twitch", eyes: "wide" }, emotion: "concerned" },
        { durationMs: 0, animationOverrides: { posture: "stand", bodyMotion: "bounce" }, speechBubble: message, emotion: "concerned" }
      ];
    case "lunch":
      return [
        { durationMs: 1500, animationOverrides: { bodyMotion: "bounce", tail: "wag" }, emotion: "excited" },
        { durationMs: 0, animationOverrides: { props: ["food"], eyes: "squint" }, speechBubble: message, emotion: "excited" }
      ];
    case "other":
    default:
      return [
        { durationMs: 1500, animationOverrides: { bodyMotion: "look-around", ears: "twitch" }, emotion: "curious" },
        { durationMs: 0, animationOverrides: { eyes: "squint" }, speechBubble: message, emotion: "caring" }
      ];
  }
}

