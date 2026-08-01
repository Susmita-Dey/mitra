/**
 * Root application shell.
 *
 * Wires the Companion Engine, EnvironmentService, Brain, and rendering layers.
 * Mitra stays a companion surface — no routes, settings, or productivity UI.
 */
import { useEffect, useMemo, useRef } from "react";
import { Companion } from "@/body";
import { createBrain, initializeBrain } from "@/brain";
import { StateDebug } from "@/ui";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { createEnvironmentService } from "@/system/environment-service";
import { createSchedulerService } from "@/system/index";
import { createWindowController, createEventBus } from "@/system/index";
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
  TimeRoutineBehavior,
  WeatherBehavior,
  MeetingHideBehavior,
  LieDownBehavior,
  WatchCursorBehavior,
  FollowCursorBehavior,
  PeekBehavior,
  WanderBehavior,
  TaskbarBehavior,
  InteractionBehavior,
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
        // Fallback if window needs to be created
        const newWin = new WebviewWindow("settings", {
          url: "/?page=settings",
          title: "Mitra Settings",
          width: 350,
          height: 480,
          decorations: true,
          transparent: false,
          alwaysOnTop: true,
        });
        await newWin.once("tauri://error", (e) => console.error(e));
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
    
    // Load preferences on startup so the Settings Panel can render
    appStorage.load().then((prefs: any) => {
      if (prefs?.behavior?.clickThrough) {
        winCtrl.setIgnoreCursorEvents(true).catch(console.error);
      }
    }).catch(console.error);

    const env           = createEnvironmentService();
    const scheduler     = createSchedulerService();
    const audioSystem   = createAudioSystem(eventBus);
    const batterySystem = createBatterySystem();
    const weatherSystem = createWeatherSystem();
    const meetingSystem = createMeetingSystem();
    
    batterySystem.start();
    weatherSystem.start();
    meetingSystem.start();
    
    const winCtrl       = createWindowController(appStorage);
    const brain         = createBrain(engine, env, winCtrl, audioSystem, batterySystem, weatherSystem, meetingSystem, eventBus);
    const _pluginManager = createPluginManager(brain, eventBus);
    
    const gitWatcher    = createGitWatcher(() => {
      brain.triggerCelebration("GitCommit");
    });
    gitWatcher.start();
    
    eventBus.subscribe("preferences:updated", (prefs: any) => {
      if (prefs.behavior?.clickThrough !== undefined) {
        winCtrl.setIgnoreCursorEvents(prefs.behavior.clickThrough).catch(console.error);
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
    brain.registerBehavior(StretchReminderBehavior);
    brain.registerBehavior(EyesReminderBehavior);
    brain.registerBehavior(SitBehavior);
    brain.registerBehavior(BatteryBehavior);
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
    brain.registerBehavior(InteractionBehavior);

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
      window.removeEventListener("companion:reminder:ack", handleAck);
      window.removeEventListener("companion:drag:start", handleDragStart);
      window.removeEventListener("companion:interaction:head", () => handleInteraction("pet"));
      window.removeEventListener("companion:interaction:tummy", () => handleInteraction("tickle"));
      window.removeEventListener("companion:interaction:paws", () => handleInteraction("high-five"));
      window.removeEventListener("companion:interaction:tail", () => handleInteraction("tail-flick"));
      window.removeEventListener("companion:interaction:ears", () => handleInteraction("ear-twitch"));
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      // Clean up plugins
      // TODO: _pluginManager.unloadAll();
      scheduler.dispose();
      env.dispose();
      eventBus.clear();
      gitWatcher.stop();
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
