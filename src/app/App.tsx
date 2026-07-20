/**
 * Root application shell.
 *
 * Wires the Companion Engine, EnvironmentService, Brain, and rendering layers.
 * Mitra stays a companion surface — no routes, settings, or productivity UI.
 */
import { useEffect, useMemo } from "react";
import { Companion } from "@/body";
import { createBrain, initializeBrain } from "@/brain";
import { StateDebug } from "@/ui";
import { createEnvironmentService } from "@/system/environment-service";
import { createSchedulerService } from "@/system/index";
import { createWindowController, createEventBus } from "@/system/index";
import { createBrowserStorage, createAppStorage } from "@/storage/index";
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
} from "@/behavior/behaviors";
import { createCompanionEngine } from "./companion-engine";

function CompanionView() {
  const character = useCharacter();

  return (
    <div className="companion-shell">
      <Companion character={character} />
      <StateDebug animation={character.animation} />
    </div>
  );
}

export function App() {
  const engine = useMemo(() => createCompanionEngine(), []);

  useEffect(() => {
    const eventBus      = createEventBus();
    const backend       = createBrowserStorage();
    const appStorage    = createAppStorage(backend, eventBus);
    const env           = createEnvironmentService();
    const scheduler     = createSchedulerService();
    const winCtrl       = createWindowController(appStorage);
    const brain         = createBrain(engine, env, winCtrl, eventBus);
    const _pluginManager = createPluginManager(brain, eventBus);
    
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

    const stopBrain = initializeBrain(brain, scheduler);

    return () => {
      stopBrain();
      scheduler.dispose();
      env.dispose();
      eventBus.clear();
    };
  }, [engine]);

  return (
    <CompanionProvider engine={engine}>
      <CompanionView />
    </CompanionProvider>
  );
}
