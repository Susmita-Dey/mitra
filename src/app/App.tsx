/**
 * Root application shell.
 *
 * Wires the Companion Engine, EnvironmentService, Brain, and rendering layers.
 * Mitra stays a companion surface — no routes, settings, or productivity UI.
 */
import { useEffect, useMemo, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { Companion } from "@/body";
import { createBrain, initializeBrain } from "@/brain";
import { StateDebug } from "@/ui";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createEnvironmentService } from "@/system/environment-service";
import { createSchedulerService } from "@/system/index";
import { createWindowController, createEventBus, createTrustManager, createNotificationSystem } from "@/system/index";
import { createBrowserStorage, createAppStorage } from "@/storage/index";
import { createAudioSystem } from "@/system/audio-system";
import { createBatterySystem } from "@/system/battery-system";
import { createWeatherSystem } from "@/system/weather-system";
import { createMeetingSystem } from "@/system/meeting-system";
import { createGitWatcher } from "@/system/git-watcher";
import { createPluginManager } from "@/plugin";
import { HelloWorldPlugin } from "@/plugin/examples/hello-world-plugin";
import { CompanionProvider } from "./companion-context";
import { useCharacter } from "./use-character";
import "./global.css";

import {
  IdleBehavior,
  BlinkBehavior,
  LookAroundBehavior,
  StretchBehavior,
  SleepBehavior,
  WalkBehavior,
  ObserveBehavior,
  YawnBehavior,
  WakeBehavior,
  LookAtCursorBehavior,
  WaterReminderBehavior,
  LunchReminderBehavior,
  DinnerReminderBehavior,
  SnackReminderBehavior,
  StretchReminderBehavior,
  EyesReminderBehavior,
  BootGreetBehavior,
  SitBehavior,
  BatteryBehavior,
  BatteryFullBehavior,
  TimeRoutineBehavior,
  WeatherBehavior,
  MeetingHideBehavior,
  LieDownBehavior,
  WatchCursorBehavior,
  FollowCursorBehavior,
  PeekBehavior,
  WanderBehavior,
  TaskbarBehavior,
  BioReminderBehavior,
  CatchUpBehavior,
} from "@/behavior/behaviors";
import { createCompanionEngine } from "./companion-engine";

function CompanionView() {
  const character = useCharacter();

  return (
    <div className="companion-shell">
      <Companion character={character} />
      <StateDebug character={character} />
    </div>
  );
}

export function App() {
  const engine = useMemo(() => createCompanionEngine(), []);
  const appStorageRef = useRef<any>(null);

  const openSettingsWindow = async () => {
    try {
      const win = await WebviewWindow.getByLabel("settings");
      if (win) {
        await win.show();
        await win.setFocus();
      } else {
        console.error("Settings window not found. Ensure it is defined in tauri.conf.json.");
      }
    } catch (err) {
      console.error("Failed to open settings window", err);
    }
  };

  useEffect(() => {
    const eventBus      = createEventBus();
    const backend       = createBrowserStorage();
    const appStorage    = createAppStorage(backend, eventBus);
    appStorageRef.current = appStorage;
    const trustManager  = createTrustManager(appStorage);
    const env           = createEnvironmentService();
    const scheduler     = createSchedulerService();
    const audioSystem   = createAudioSystem(eventBus);
    const batterySystem = createBatterySystem();
    const weatherSystem = createWeatherSystem(trustManager);
    const meetingSystem = createMeetingSystem();
    
    batterySystem.start();
    weatherSystem.start();
    // MeetingSystem uses the central Scheduler — no raw setInterval
    meetingSystem.start(scheduler);
    
    const winCtrl       = createWindowController(appStorage);
    const brain         = createBrain(engine, env, winCtrl, audioSystem, batterySystem, weatherSystem, meetingSystem, eventBus);
    const _pluginManager = createPluginManager(brain, eventBus);

    // Notification system: queues reminders when hidden, fires OS toast on resurface
    const notificationSystem = createNotificationSystem((title, body) => {
      // Use the Tauri notification plugin when available, otherwise console.log
      // The Tauri notification plugin is async-invoked by name
      (window as any).__tauriShowNotification?.({ title, body }).catch?.(() => {
        console.info(`[Notification] ${title}: ${body}`);
      });
    });
    (window as any).__notificationSystem = notificationSystem;
    
    const gitWatcher    = createGitWatcher(() => {
      brain.triggerCelebration("GitCommit");
    });
    gitWatcher.start();
    
    let clickThroughPref = false;

    const updateClickThrough = () => {
      const char = engine.getCharacter();
      const isIdleOrSleeping = char.animation === "idle" || char.animation === "sleep" || char.animation === "wander";
      const hasBubble = !!char.bubbleText;
      const shouldIgnore = clickThroughPref && isIdleOrSleeping && !hasBubble;
      winCtrl.setIgnoreCursorEvents(shouldIgnore).catch(console.error);
    };

    const unsubscribeEngine = engine.subscribe(updateClickThrough);

    // Assume onboarding might be active until storage loads, to prevent premature greetings
    (window as any).ONBOARDING_ACTIVE = true;

    // Load preferences on startup so the Settings Panel can render
    appStorage.load().then(async (prefs: any) => {
      clickThroughPref = !!prefs?.behavior?.clickThrough;
      if (!prefs?.onboardingComplete) {
        (window as any).ONBOARDING_ACTIVE = true;
        // Hide main window, show onboarding window
        await getCurrentWindow().hide();
        const onboardWin = await WebviewWindow.getByLabel("onboarding");
        if (onboardWin) await onboardWin.show();
      } else {
        (window as any).ONBOARDING_ACTIVE = false;
        await getCurrentWindow().show();
      }
      updateClickThrough();
    }).catch(console.error);

    // Listen to visibility events from tray
    (window as any).IS_HIDDEN = false;
    const unlistenHidden = listen("companion:window:hidden", () => {
      (window as any).IS_HIDDEN = true;
      notificationSystem.setHidden(true);
    });
    const unlistenShown = listen("companion:window:shown", () => {
      (window as any).IS_HIDDEN = false;
      notificationSystem.setHidden(false);
      notificationSystem.onResurface(); // flush queued notifications as OS toast summary
      // Trigger a special event to evaluate the CatchUp behavior
      window.dispatchEvent(new CustomEvent("companion:window:shown"));
    });

    let lastPlaying = false;
    let lastTrack = "";
    
    const unlistenMedia = listen("media-session-update", (event: any) => {
      const state = event.payload;
      const trackId = `${state.title}-${state.artist}`;
      
      if (state.is_playing && !lastPlaying) {
        eventBus.publish("media:started", { title: state.title, artist: state.artist, source: state.source });
        lastPlaying = true;
        lastTrack = trackId;
      } else if (!state.is_playing && lastPlaying) {
        eventBus.publish("media:paused", undefined as any);
        lastPlaying = false;
      } else if (state.is_playing && trackId !== lastTrack) {
        eventBus.publish("media:changed", { title: state.title, artist: state.artist, source: state.source });
        lastTrack = trackId;
      }
    });

    eventBus.subscribe("preferences:updated", (prefs: any) => {
      if (prefs.behavior?.clickThrough !== undefined) {
        clickThroughPref = prefs.behavior.clickThrough;
        updateClickThrough();
      }
      if (prefs.behavior?.weatherLocation !== undefined) {
        weatherSystem.setLocation(prefs.behavior.weatherLocation);
      }
    });

    // Demonstrate loading a plugin statically
    _pluginManager.loadPlugin(HelloWorldPlugin).catch(console.error);

    // Restore saved position on boot
    winCtrl.restorePosition().catch(console.error);

    brain.registerBehavior(IdleBehavior);
    brain.registerBehavior(BlinkBehavior);
    brain.registerBehavior(LookAroundBehavior);
    brain.registerBehavior(StretchBehavior);
    brain.registerBehavior(SleepBehavior);
    brain.registerBehavior(WalkBehavior);
    brain.registerBehavior(ObserveBehavior);
    brain.registerBehavior(YawnBehavior);
    brain.registerBehavior(WakeBehavior);
    brain.registerBehavior(LookAtCursorBehavior);
    brain.registerBehavior(WaterReminderBehavior);
    brain.registerBehavior(LunchReminderBehavior);
    brain.registerBehavior(DinnerReminderBehavior);
    brain.registerBehavior(SnackReminderBehavior);
    brain.registerBehavior(BioReminderBehavior);
    brain.registerBehavior(StretchReminderBehavior);
    brain.registerBehavior(EyesReminderBehavior);
    brain.registerBehavior(SitBehavior);
    brain.registerBehavior(BatteryBehavior);
    brain.registerBehavior(BatteryFullBehavior);
    brain.registerBehavior(TimeRoutineBehavior);
    brain.registerBehavior(WeatherBehavior);
    brain.registerBehavior(MeetingHideBehavior);
    brain.registerBehavior(BootGreetBehavior);
    brain.registerBehavior(LieDownBehavior);
    brain.registerBehavior(WatchCursorBehavior);
    brain.registerBehavior(FollowCursorBehavior);
    brain.registerBehavior(PeekBehavior);
    brain.registerBehavior(WanderBehavior);
    brain.registerBehavior(TaskbarBehavior);
    brain.registerBehavior(CatchUpBehavior);

    const stopBrain = initializeBrain(brain, scheduler);

    // Host integration: bind DOM events to the headless Brain API
    const handleAck = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.id) {
        brain.acknowledgeReminder(ce.detail.id);
      }
    };
    
    const handlePointerDown = () => {
      brain.registerInteraction();
    };

    const handleInteraction = (interaction: string) => {
      brain.triggerInteraction(interaction as import("@/brain/interaction-engine").CompanionInteraction);
    };

    const handleDragStart = () => {
      winCtrl.startDrag().catch(console.error);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      openSettingsWindow();
    };

    const handleDebug = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.type === 'force-reminder') {
        brain.debugForceReminder(detail.payload);
      } else if (detail.type === 'force-emotion') {
        brain.pushEmotion(detail.payload);
      } else if (detail.type === 'force-interaction') {
        if (detail.payload === 'pet') brain.registerInteraction();
        // we can add other interaction forced triggers later if needed
      }
    };

    window.addEventListener("companion:debug", handleDebug);
    window.addEventListener("companion:reminder:ack", handleAck);
    window.addEventListener("companion:drag:start", handleDragStart);
    window.addEventListener("companion:interaction:head", () => handleInteraction("pet"));
    window.addEventListener("companion:interaction:tummy", () => handleInteraction("tickle"));
    window.addEventListener("companion:interaction:paws", () => handleInteraction("high-five"));
    window.addEventListener("companion:interaction:tail", () => handleInteraction("tail-flick"));
    window.addEventListener("companion:interaction:ears", () => handleInteraction("ear-twitch"));
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      stopBrain();
      meetingSystem.dispose();
      unlistenHidden.then((f: any) => f());
      unlistenShown.then((f: any) => f());
      unlistenMedia.then((f: any) => f());
      unsubscribeEngine();
      window.removeEventListener("companion:debug", handleDebug);
      window.removeEventListener("companion:reminder:ack", handleAck);
      window.removeEventListener("companion:drag:start", handleDragStart);
      window.removeEventListener("companion:interaction:head", () => handleInteraction("pet"));
      window.removeEventListener("companion:interaction:tummy", () => handleInteraction("tickle"));
      window.removeEventListener("companion:interaction:paws", () => handleInteraction("high-five"));
      window.removeEventListener("companion:interaction:tail", () => handleInteraction("tail-flick"));
      window.removeEventListener("companion:interaction:ears", () => handleInteraction("ear-twitch"));
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      scheduler.dispose();
      env.dispose();
      eventBus.clear();
      gitWatcher.stop();
      unsubscribeEngine();
    };
  }, [engine]);

  return (
    <CompanionProvider engine={engine}>
      <CompanionView />

      {/* Settings / Menu Gear Icon */}
      <button 
        className="settings-btn"
        onClick={openSettingsWindow}
        title="Mitra Options"
      >
        ⚙️
      </button>
    </CompanionProvider>
  );
}
