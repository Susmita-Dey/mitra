/**
 * Root application shell.
 *
 * Wires the Companion Engine, EnvironmentService, Brain, and rendering layers.
 * Mitra stays a companion surface — no routes, settings, or productivity UI.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Companion } from "@/body";
import { createBrain, initializeBrain } from "@/brain";
import { StateDebug } from "@/ui";
import { Updater } from "@/components/Updater";
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
import { commandRegistry, type CommandContext } from "@/system/command-registry";
import { syncVisibilityState } from "@/system/executors";

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
  UserBirthdayBehavior,
  MitraBirthdayBehavior,
  CustomReminderBehavior,
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
  const winCtrlRef = useRef<any>(null);
  const brainRef = useRef<import("@/brain").Brain | null>(null);
  const audioSystemRef = useRef<import("@/system/audio-system").AudioSystem | null>(null);

  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [toast, setToast] = useState<{ id: string; label: string; details?: string } | null>(null);

  const isCommandBarOpenRef = useRef(false);
  isCommandBarOpenRef.current = isCommandBarOpen;

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

  // isCommandBarOpenRef.current is read synchronously inside the updateClickThrough
  // closure subscribed to the engine. No second useEffect needed — the engine
  // subscription is the single, authoritative trigger path.

  useEffect(() => {
    const eventBus = createEventBus();
    const backend = createBrowserStorage();
    const appStorage = createAppStorage(backend, eventBus);
    appStorageRef.current = appStorage;
    const trustManager = createTrustManager(appStorage);
    const env = createEnvironmentService();
    const scheduler = createSchedulerService();
    const audioSystem = createAudioSystem(eventBus);
    const batterySystem = createBatterySystem();
    const weatherSystem = createWeatherSystem(trustManager);
    const meetingSystem = createMeetingSystem();

    batterySystem.start();
    weatherSystem.start();
    // MeetingSystem uses the central Scheduler — no raw setInterval
    meetingSystem.start(scheduler);

    const winCtrl = createWindowController(appStorage);
    winCtrlRef.current = winCtrl;
    const brain = createBrain(engine, env, winCtrl, audioSystem, batterySystem, weatherSystem, meetingSystem, eventBus, appStorage);
    brainRef.current = brain;
    audioSystemRef.current = audioSystem;
    (window as any).__brain_instance = brain;
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

    const gitWatcher = createGitWatcher(() => {
      brain.triggerCelebration("GitCommit");
    });
    gitWatcher.start();

    let clickThroughPref = false;
    let lastIgnoreState: boolean | null = null;

    const updateClickThrough = () => {
      const char = engine.getCharacter();
      const isIdleOrSleeping =
        char.animation === "idle" ||
        char.animation === "sleep" ||
        char.animation === "wander" ||
        char.animation === "walk";
      const hasBubble = !!char.bubbleText;
      const shouldIgnore =
        clickThroughPref && isIdleOrSleeping && !hasBubble && !isCommandBarOpenRef.current;

      // Guard: only call IPC when the desired state actually changes.
      // The clickThroughBusy guard is no longer needed — the IPC serial queue
      // in WindowController ensures setIgnoreCursorEvents calls are serialized.
      if (lastIgnoreState !== shouldIgnore) {
        lastIgnoreState = shouldIgnore;
        winCtrl.setIgnoreCursorEvents(shouldIgnore).catch(console.error);
      }
    };

    // Single update path: engine subscription only.
    // isCommandBarOpenRef.current is read inside the closure so command-bar
    // state changes are naturally captured on the next engine notification.
    const unsubscribeEngine = engine.subscribe(updateClickThrough);

    // Assume onboarding might be active until storage loads, to prevent premature greetings
    (window as any).ONBOARDING_ACTIVE = true;

    // Load preferences on startup so the Settings Panel can render
    appStorage.load().then(async (prefs: any) => {
      clickThroughPref = !!prefs?.behavior?.clickThrough;
      if (!prefs?.onboardingComplete) {
        (window as any).ONBOARDING_ACTIVE = true;
        // Guard: only hide if currently visible — avoids redundant IPC on transparent window.
        try {
          const isVis = await getCurrentWindow().isVisible();
          if (isVis) await getCurrentWindow().hide();
        } catch { /* non-fatal */ }
        const onboardWin = await WebviewWindow.getByLabel("onboarding");
        if (onboardWin) {
          const isOnboardVis = await onboardWin.isVisible().catch(() => false);
          if (!isOnboardVis) await onboardWin.show();
        }
      } else {
        (window as any).ONBOARDING_ACTIVE = false;
        // Guard: only show if currently hidden.
        try {
          const isVis = await getCurrentWindow().isVisible();
          if (!isVis) await getCurrentWindow().show();
        } catch { await getCurrentWindow().show(); }
      }
      updateClickThrough();
    }).catch(console.error);

    const unlistenOnboarding = listen("onboarding-completed", async () => {
      (window as any).ONBOARDING_ACTIVE = false;
      // Guard: only show if currently hidden (avoids redundant IPC on transparent window)
      try {
        const isVis = await getCurrentWindow().isVisible();
        if (!isVis) await getCurrentWindow().show();
      } catch { await getCurrentWindow().show(); }
    });

    const unlistenTask = listen("task:completed", (e: any) => {
      const size = e.payload?.size;
      if (size === "big") {
        brain.triggerCelebration("TaskCompletedBig");
      } else {
        brain.triggerCelebration("TaskCompletedSmall");
      }
    });

    // Listen to visibility events from tray
    (window as any).IS_HIDDEN = false;
    const unlistenHidden = listen("companion:window:hidden", () => {
      (window as any).IS_HIDDEN = true;
      // Sync the executor visibility guard so brain ticks don't re-issue hide IPC.
      syncVisibilityState(true);
      // Disable click-through BEFORE the window becomes hidden — prevents WebView2
      // from rendering the transparent window as a solid black rectangle.
      winCtrl.setIgnoreCursorEvents(false).catch(console.error);
      lastIgnoreState = false;
      notificationSystem.setHidden(true);
    });
    const unlistenShown = listen("companion:window:shown", () => {
      (window as any).IS_HIDDEN = false;
      // Sync the executor visibility guard so brain ticks don't re-issue show IPC.
      syncVisibilityState(false);
      notificationSystem.setHidden(false);
      notificationSystem.onResurface();
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

    // Listen to global Tauri events for preferences (since localStorage 'storage' event is sometimes flaky across webviews)
    const unlistenPrefs = listen("preferences:updated", () => {
      appStorage.load().catch(console.error);
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
    brain.registerBehavior(UserBirthdayBehavior);
    brain.registerBehavior(MitraBirthdayBehavior);
    brain.registerBehavior(CustomReminderBehavior);

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
        brain.triggerInteraction(detail.payload);
      } else if (detail.type === 'show-bubble') {
        brain.showCustomBubble(detail.payload.text, detail.payload.duration);
      }
    };

    const handlePet = () => handleInteraction("pet");
    const handleTickle = () => handleInteraction("tickle");
    const handleTap = () => handleInteraction("gentle-tap");
    const handleHighFive = () => handleInteraction("high-five");
    const handleTailFlick = () => handleInteraction("tail-flick");
    const handleEarTwitch = () => handleInteraction("ear-twitch");
    const handlePoke = () => handleInteraction("poke");

    // Sound player listener
    const handlePlaySound = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.category) {
        audioSystem.playSound(detail.category);
      }
    };
    window.addEventListener("companion:sound:play", handlePlaySound);

    // Command Bar Trigger listeners
    const handleOpenCommandBar = () => {
      setIsCommandBarOpen(true);
    };
    const handleCloseCommandBar = () => {
      setIsCommandBarOpen(false);
      setToast(null);
    };
    window.addEventListener("companion:command-bar:open", handleOpenCommandBar);
    window.addEventListener("companion:command-bar:close", handleCloseCommandBar);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);

    const unlistenFocusCommandBar = listen("companion:window:focus_command_bar", () => {
      setIsCommandBarOpen(true);
    });

    const handleUndo = async (e: Event) => {
      const ce = e as CustomEvent;
      const id = ce.detail?.id;
      if (!id) return;
      try {
        const currentPrefs = await appStorage.load();
        const updatedCustom = (currentPrefs.customReminders || []).filter((r: any) => r.id !== id);
        await appStorage.update({ customReminders: updatedCustom });
        // Direct brain call — no CustomEvent round-trip.
        brain.showCustomBubble("Cancelled that reminder! 🛑", 3000);
      } catch (err) {
        console.error("Failed to undo custom reminder", err);
      }
    };
    window.addEventListener("companion:reminder:undo", handleUndo);

    window.addEventListener("companion:debug", handleDebug);
    window.addEventListener("companion:reminder:ack", handleAck);
    window.addEventListener("companion:drag:start", handleDragStart);
    window.addEventListener("companion:interaction:head", handlePet);
    window.addEventListener("companion:interaction:tummy", handleTickle);
    window.addEventListener("companion:interaction:paws", handleTap);
    window.addEventListener("companion:interaction:hand", handleHighFive);
    window.addEventListener("companion:interaction:tail", handleTailFlick);
    window.addEventListener("companion:interaction:ears", handleEarTwitch);
    window.addEventListener("companion:interaction:poke", handlePoke);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      stopBrain();
      meetingSystem.dispose();
      weatherSystem.dispose();
      batterySystem.dispose();
      appStorage.dispose();
      winCtrl.dispose();
      unlistenHidden.then((f: any) => f());
      unlistenShown.then((f: any) => f());
      unlistenMedia.then((f: any) => f());
      unlistenOnboarding.then((f: any) => f());
      unlistenTask.then((f: any) => f());
      unlistenPrefs.then((f: any) => f());
      unsubscribeEngine();
      window.removeEventListener("companion:sound:play", handlePlaySound);
      window.removeEventListener("companion:command-bar:open", handleOpenCommandBar);
      window.removeEventListener("companion:command-bar:close", handleCloseCommandBar);
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("companion:reminder:undo", handleUndo);
      unlistenFocusCommandBar.then((f: any) => f());
      window.removeEventListener("companion:debug", handleDebug);
      window.removeEventListener("companion:reminder:ack", handleAck);
      window.removeEventListener("companion:drag:start", handleDragStart);
      window.removeEventListener("companion:interaction:head", handlePet);
      window.removeEventListener("companion:interaction:tummy", handleTickle);
      window.removeEventListener("companion:interaction:paws", handleTap);
      window.removeEventListener("companion:interaction:hand", handleHighFive);
      window.removeEventListener("companion:interaction:tail", handleTailFlick);
      window.removeEventListener("companion:interaction:ears", handleEarTwitch);
      window.removeEventListener("companion:interaction:poke", handlePoke);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      scheduler.dispose();
      env.dispose();
      eventBus.clear();
      gitWatcher.stop();
      _pluginManager.unloadAll().catch(console.error);
    };
  }, [engine]);

  // Toast auto-clear — 7 seconds to give time to read + undo
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <CompanionProvider engine={engine}>
      <Updater />
      <CompanionView />

      <CommandBar
        isOpen={isCommandBarOpen}
        setIsOpen={setIsCommandBarOpen}
        appStorageRef={appStorageRef}
        setToast={setToast}
        brainRef={brainRef}
        audioSystemRef={audioSystemRef}
      />

      {toast && (
        <div className="mitra-toast open">
          <div className="mitra-toast-progress" />
          <div className="mitra-toast-content">
            <span className="mitra-toast-icon">✓</span>
            <div className="mitra-toast-text">
              <strong className="mitra-toast-title">{toast.label}</strong>
              {toast.details && <span className="mitra-toast-desc">{toast.details}</span>}
            </div>
            <button
              className="mitra-toast-undo"
              onClick={() => {
                const ce = new CustomEvent("companion:reminder:undo", { detail: { id: toast.id } });
                window.dispatchEvent(ce);
                setToast(null);
              }}
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {/* Settings / Menu Gear Icon */}
      <button
        className="settings-btn"
        onClick={openSettingsWindow}
        title="Mitra Options"
      >
        ⚙️
      </button>

      {/* Command Bar Discovery Hint */}
      {/* {!isCommandBarOpen && (
        <button
          className="command-hint-btn"
          onClick={() => setIsCommandBarOpen(true)}
          title="Open command bar (Ctrl+K or /)"
        >
          <span className="command-hint-key">Ctrl+K</span>
          <span className="command-hint-label">· set a reminder</span>
        </button>
      )} */}
    </CompanionProvider>
  );
}

interface CommandBarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  appStorageRef: React.RefObject<any>;
  setToast: (toast: { id: string; label: string; details?: string } | null) => void;
  /** Direct brain reference — avoids DOM CustomEvent round-trip for feedback calls. */
  brainRef: React.RefObject<import("@/brain").Brain | null>;
  /** Direct audio system reference — avoids CustomEvent round-trip for sound feedback. */
  audioSystemRef: React.RefObject<import("@/system/audio-system").AudioSystem | null>;
}

function CommandBar({ isOpen, setIsOpen, appStorageRef, setToast, brainRef, audioSystemRef }: CommandBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; icon: string; value: string }>>([]);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("mitra_command_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen && inputRef.current) {
      timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const el = document.querySelector(".command-bar-wrapper");
      if (el && !el.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Autocomplete Suggestions & Preview
  useEffect(() => {
    const val = inputValue.trim().toLowerCase();
    if (!val) {
      setPreview(null);
      setSuggestions([]);
      return;
    }

    // 1. Suggestions matching prefix
    const list: Array<{ label: string; icon: string; value: string }> = [];
    // Slash-command mode: only when the input *starts* with '/' (not mid-sentence)
    if (inputValue.startsWith("/")) {
      const query = val.substring(1);
      const actions = commandRegistry.getActions();
      for (const action of actions) {
        if (action.id.startsWith(query) || action.keywords.some(k => k.startsWith(query))) {
          list.push({
            label: action.name,
            icon: action.icon,
            value: `/${action.id}`
          });
        }
      }
    } else {
      // Only suggest reminders that will pass the clash check.
      // Water, stretch, coffee, meals, eyes are built-in — don't suggest them (they'll always fail).
      if (/\b(med|pill|tablet|dose|vitamin|pills|vitamins|medicine)\b/.test(val)) {
        list.push({ label: "Take Medicine · add a time", icon: "💊", value: "medicine at 8am" });
      }
      if (/\b(meeting|standup|call|zoom|huddle|sync)\b/.test(val)) {
        list.push({ label: "Meeting Reminder · add a time", icon: "📅", value: "meeting at 3pm" });
      }
      // If they typed something that IS a built-in, hint them to Settings instead of letting them fail
      if (/\b(water|drink|hydrate|coffee|caffeine|tea|stretch|posture|lunch|dinner|snack|eat|eyes|eye|break|rest)\b/.test(val)) {
        list.push({ label: "This is a built-in reminder — customize in Settings ⚙️", icon: "ℹ️", value: "" });
      }
    }
    setSuggestions(list);

    // 2. Real-time command preview
    const matched = commandRegistry.findAction(inputValue);
    if (matched && matched.action.preview) {
      const prev = matched.action.preview(matched.cleanInput);
      if (prev) {
        setPreview(prev.details ? `${prev.label} (${prev.details})` : prev.label);
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const matched = commandRegistry.findAction(text);
    if (!matched) return;

    const { action, cleanInput } = matched;
    const storage = appStorageRef.current;
    if (!storage) return;

    // Access brain and audio directly via refs — no CustomEvent round-trip.
    const brain = brainRef.current;
    const audio = audioSystemRef.current;

    const context: CommandContext = {
      brain: brain ?? (window as any).__brain_instance,
      appStorage: storage,
      winCtrl: (window as any).__win_controller,
    };

    const result = await action.execute(cleanInput, context);

    if (result.success) {
      // Play success chirp directly — no CustomEvent needed.
      audio?.playSound("chirps");

      // Push feedback emotion directly to brain.
      if (result.feedbackEmotion && brain) {
        brain.pushEmotion(result.feedbackEmotion as import("@/types").Emotion);
      }

      // Show feedback bubble directly.
      if (result.feedbackText && brain) {
        brain.showCustomBubble(result.feedbackText, 5000);
      }

      // If reminder was parsed
      if (action.id === "remind" && result.data?.parsed) {
        const parsed = result.data.parsed;
        const newReminder = {
          id: `custom_${Date.now()}`,
          label: parsed.label,
          type: parsed.type,
          enabled: true,
          intervalMs: parsed.intervalMs,
          time: parsed.time,
          countdownMs: parsed.countdownMs,
          createdAt: Date.now()
        };

        try {
          const currentPrefs = await storage.load();
          const updatedCustom = [...(currentPrefs.customReminders || []), newReminder];
          await storage.update({ customReminders: updatedCustom });

          // Detect if the parser used the 30-minute default fallback
          const isDefaultFallback =
            parsed.triggerType === "countdown" &&
            parsed.countdownMs === 30 * 60 * 1000 &&
            !parsed.time &&
            !parsed.intervalMs &&
            !/\bin\s+\d+/i.test(cleanInput);

          let timeDesc = "";
          if (parsed.triggerType === "countdown" && parsed.countdownMs) {
            const mins = Math.round(parsed.countdownMs / 60000);
            timeDesc = mins > 0 ? `in ${mins}m` : `in ${Math.round(parsed.countdownMs / 1000)}s`;
            if (isDefaultFallback) timeDesc += " (no time given — default)";
          } else if (parsed.triggerType === "interval" && parsed.intervalMs) {
            const mins = Math.round(parsed.intervalMs / 60000);
            timeDesc = mins > 0 ? `every ${mins}m` : `every ${Math.round(parsed.intervalMs / 1000)}s`;
          } else if (parsed.triggerType === "time" && parsed.time) {
            timeDesc = `at ${parsed.time}`;
          }

          setToast({
            id: newReminder.id,
            label: parsed.label,
            details: timeDesc
          });

          // Direct Brain calls — replaces 2 sequential companion:debug CustomEvents.
          if (brain) {
            brain.pushEmotion("happy");
            brain.showCustomBubble(`Got it! I'll remind you to: ${parsed.label} ⏰`, 4000);
          }

        } catch (err) {
          console.error(err);
        }
      }

      // Persist command history — deferred write to avoid blocking the submit path.
      const nextHistory = [text, ...history.filter((h) => h !== text)].slice(0, 50);
      setHistory(nextHistory);
      setHistoryIndex(-1);
      // Yield to the event loop before writing so the UI can update first.
      Promise.resolve().then(() => {
        try {
          localStorage.setItem("mitra_command_history", JSON.stringify(nextHistory));
        } catch (err) {
          console.error("[CommandBar] Failed to save history", err);
        }
      });

      setIsOpen(false);
      setInputValue("");
    } else {
      // Error / safety interception — direct Brain calls.
      if (brain) {
        brain.pushEmotion("concerned");
        brain.showCustomBubble(result.message || "Failed to parse command.", 8000);
      }

      if (result.data?.safety) {
        setInputValue("");
        setIsOpen(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < history.length) {
          setHistoryIndex(nextIndex);
          setInputValue(history[nextIndex]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInputValue(history[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInputValue("");
      }
    } else if (e.key === "Tab") {
      // Tab autocompletes the first suggestion that has an actual value
      const firstReal = suggestions.find(s => s.value);
      if (firstReal) {
        e.preventDefault();
        setInputValue(firstReal.value);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(firstReal.value.length, firstReal.value.length);
          }
        });
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setInputValue("");
    }
  };

  return (
    <div className={`command-bar-wrapper ${isOpen ? "open" : ""}`}>
      {suggestions.length > 0 && (
        <div className="command-suggestions">
          {suggestions.map((s, index) => (
            <div
              key={index}
              className="suggestion-item"
              onMouseDown={(e) => {
                // Prevent blur from firing before we set the value
                e.preventDefault();
              }}
              onClick={() => {
                setInputValue(s.value);
                // Place cursor at end of the template so user can edit the time part
                requestAnimationFrame(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(s.value.length, s.value.length);
                  }
                });
              }}
            >
              <span className="suggestion-icon">{s.icon}</span>
              <span className="suggestion-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="command-form">
        <span className="command-icon">⏰</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Reminder or command… (Tab to autocomplete)"
          className="command-input"
        />
        {inputValue && <button type="submit" className="command-submit">➔</button>}
      </form>
      {preview && (
        <div className="command-preview">
          {preview}
        </div>
      )}
    </div>
  );
}

