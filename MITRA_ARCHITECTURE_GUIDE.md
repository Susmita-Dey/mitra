# MITRA Architecture Guide

**Repository root:** `/home/runner/work/mitra/mitra`  
**Purpose:** Deep operational guide for engineers who need to understand, modify, and explain Mitra confidently after long context gaps.

---

## 1. How to Read This Guide

This document is organized as:

1. Runtime execution map (what runs when)
2. Folder-by-folder architecture map
3. File-level module catalog (purpose, dependencies, lifecycle)
4. Interaction graphs (how data and control flow through modules)
5. Ownership and change strategy

All paths are absolute and point to the current repository layout.

---

## 2. Runtime Execution Overview

## 2.1 Window Entry Points

- `/home/runner/work/mitra/mitra/src/main.tsx` reads `?page=` query and mounts:
  - `App` (main companion)
  - `SettingsPage`
  - `OnboardingPage`
  - `TasksPage`

Tauri window URLs map to these pages via `/home/runner/work/mitra/mitra/src-tauri/tauri.conf.json` and runtime tray spawning logic in `/home/runner/work/mitra/mitra/src-tauri/src/system/tray.rs`.

## 2.2 Main App Boot Flow

1. `App.tsx` creates systems (event bus, storage, trust, env, scheduler, audio, battery, weather, meeting, window controller).
2. `createBrain(...)` receives engine + services.
3. Behaviors are registered.
4. `initializeBrain(...)` schedules 1-second tick.
5. Tick cycle: `observe -> think -> act`.
6. Companion state updates flow into `CompanionEngine` and re-render through `useSyncExternalStore`.

## 2.3 Native Host Boot Flow

- `/home/runner/work/mitra/mitra/src-tauri/src/main.rs` calls `mitra_lib::run()`.
- `/home/runner/work/mitra/mitra/src-tauri/src/lib.rs`:
  - registers commands: `get_screen_info`, `check_meeting_status`, `check_coding_status`, `get_git_hash`
  - initializes updater/process plugins
  - configures main window + tray
  - starts media listener bridge

---

## 3. Repository-Level Layout

| Path | Purpose | Runtime Criticality |
|---|---|---|
| `/home/runner/work/mitra/mitra/src` | Frontend runtime and domain engine | Critical |
| `/home/runner/work/mitra/mitra/src-tauri` | Rust host and desktop integration | Critical |
| `/home/runner/work/mitra/mitra/public` | Static runtime assets (audio/images) | High |
| `/home/runner/work/mitra/mitra/.github` | CI templates/workflows metadata | Medium |
| `/home/runner/work/mitra/mitra/README.md` | Product-facing overview | Medium |
| `/home/runner/work/mitra/mitra/CONTRIBUTING.md` | Developer practices and architecture summary | High |
| `/home/runner/work/mitra/mitra/FINAL_PRODUCTION_VERIFICATION.md` | QA verification baseline | High |

---

## 4. Frontend Folder and Module Catalog

## 4.1 `/home/runner/work/mitra/mitra/src/app`

### Primary modules

| File | Purpose | Lifecycle | Dependencies | Interactions | Suggested Ownership |
|---|---|---|---|---|---|
| `/home/runner/work/mitra/mitra/src/app/App.tsx` | Main composition root for companion runtime | Main window mount/unmount | brain, body, system, plugin, storage modules + Tauri APIs | Wires all systems, registers behaviors, handles global events | Product Surface + Runtime Integration |
| `/home/runner/work/mitra/mitra/src/app/companion-engine.ts` | External character state store with subscribe/patch | Created once per App instance | `types/character`, React external store protocol | Single source of truth for render state | Runtime Architecture |
| `/home/runner/work/mitra/mitra/src/app/companion-context.tsx` | React provider for engine | Mount-level | React context APIs | Exposes engine to hooks/components | Product Surface |
| `/home/runner/work/mitra/mitra/src/app/use-character.ts` | Hook for consuming external character store | Component-level | `useSyncExternalStore` | Triggers render when engine patches | Product Surface |
| `/home/runner/work/mitra/mitra/src/app/SettingsPage.tsx` | Settings webview page, edits preferences | Settings window lifecycle | storage, Tauri window APIs | writes preferences, hides window on save | Product Surface |
| `/home/runner/work/mitra/mitra/src/app/OnboardingPage.tsx` | First-run onboarding and profile capture | Onboarding window lifecycle | storage, Tauri window/event APIs | sets onboardingComplete, emits onboarding event | Product Surface |
| `/home/runner/work/mitra/mitra/src/app/TasksPage.tsx` | simple task list + completion emit | Tasks window lifecycle | localStorage, Tauri event APIs | emits `task:completed` for celebration | Product Surface |
| `/home/runner/work/mitra/mitra/src/app/index.ts` | Barrel exports for app modules | Build-time | TS module system | Import convenience | Runtime Architecture |
| `/home/runner/work/mitra/mitra/src/app/global.css` | shared app styling | Always loaded by app pages | CSS | global visual baseline | Design Systems |
| `/home/runner/work/mitra/mitra/src/app/Onboarding.css` | onboarding view styles | Onboarding page render | CSS | onboarding UX | Design Systems |
| `/home/runner/work/mitra/mitra/src/app/Tasks.css` | tasks page styles | Tasks page render | CSS | tasks UX | Design Systems |

## 4.2 `/home/runner/work/mitra/mitra/src/brain`

### Core orchestrator

| File | Purpose | Lifecycle | Dependencies | Interactions | Suggested Ownership |
|---|---|---|---|---|---|
| `/home/runner/work/mitra/mitra/src/brain/brain.ts` | Main intelligence orchestration (`observe/think/act`) | Created once in App, ticked every second | behavior engine, emotion engine, reminder engine, systems, animation director, executors | central command center for all behavior and state | Companion Intelligence |
| `/home/runner/work/mitra/mitra/src/brain/index.ts` | Brain exports | Build-time | TS module system | import entry | Companion Intelligence |

### Brain state and memory

| File | Purpose | Notes |
|---|---|---|
| `/home/runner/work/mitra/mitra/src/brain/memory.ts` | Defines `CompanionMemory`, reminder item schema, default memory structure | Major domain state contract |
| `/home/runner/work/mitra/mitra/src/brain/memory-engine.ts` | In-memory state holder with shallow merge update | Fast local memory without persistence |
| `/home/runner/work/mitra/mitra/src/brain/timeline.ts` | bounded event timeline utility | Debug/behavior history context |

### Emotional/behavioral engines

| File | Purpose | Critical Behavior |
|---|---|---|
| `/home/runner/work/mitra/mitra/src/brain/core/emotion-engine.ts` | Emotion transition logic and procedural-state derivation | priority + interruptibility + decay rules |
| `/home/runner/work/mitra/mitra/src/brain/emotion-definitions.ts` | static emotion transition metadata | canonical policy table |
| `/home/runner/work/mitra/mitra/src/brain/core/life-rhythm.ts` | time/day context baseline mood and energy modifiers | ambient personality cadence |
| `/home/runner/work/mitra/mitra/src/brain/core/attachment.ts` | attachment level + modifier from usage patterns | long-term relationship simulation |
| `/home/runner/work/mitra/mitra/src/brain/core/context-engine.ts` | synthesizes `ContextState` (meeting/focus/timeOfDay/coding) | meeting and coding detection callouts |
| `/home/runner/work/mitra/mitra/src/brain/core/animation-director.ts` | sequence queue, preemption, priority arbitration, render-state output | reminder anticipation and interaction choreography |
| `/home/runner/work/mitra/mitra/src/brain/core/types.ts` | context/emotion/procedural state interfaces | inter-engine contract backbone |

### Interaction and adaptation engines

| File | Purpose | Trigger Surface |
|---|---|---|
| `/home/runner/work/mitra/mitra/src/brain/interaction-engine.ts` | maps user interactions to intents and memory updates | user gestures/clicks |
| `/home/runner/work/mitra/mitra/src/brain/celebration-engine.ts` | event-driven celebration intent emitter | task/git/birthday/reminder milestones |
| `/home/runner/work/mitra/mitra/src/brain/personality-engine.ts` | slowly adapts personality vector | interaction patterns + environment |
| `/home/runner/work/mitra/mitra/src/brain/delight-engine.ts` | stochastic delight events with cooldown | ambient emotional richness |
| `/home/runner/work/mitra/mitra/src/brain/presence-engine.ts` | computes presence states (taskbar, sit, lie, yawn, sleep, follow, hide) | environment and meeting state |

### Reminder behavior modules (`/home/runner/work/mitra/mitra/src/brain/reminders`)

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/brain/reminders/reminder-engine.ts` | schedules, defers, triggers, ignores, and reschedules reminders |
| `/home/runner/work/mitra/mitra/src/brain/reminders/water-reminder.ts` | behavior wrapper for water reminder trigger |
| `/home/runner/work/mitra/mitra/src/brain/reminders/stretch-reminder.ts` | behavior wrapper for stretch reminder trigger |
| `/home/runner/work/mitra/mitra/src/brain/reminders/eyes-reminder.ts` | behavior wrapper for eyes reminder trigger |
| `/home/runner/work/mitra/mitra/src/brain/reminders/lunch-reminder.ts` | behavior wrapper for lunch reminder trigger |
| `/home/runner/work/mitra/mitra/src/brain/reminders/dinner-reminder.ts` | behavior wrapper for dinner reminder trigger |
| `/home/runner/work/mitra/mitra/src/brain/reminders/snack-reminder.ts` | behavior wrapper for snack reminder trigger |
| `/home/runner/work/mitra/mitra/src/brain/reminders/bio-reminder.ts` | behavior wrapper for bio reminder trigger |

## 4.3 `/home/runner/work/mitra/mitra/src/behavior`

### Engine and contracts

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/behavior/behavior.ts` | behavior context and behavior interface |
| `/home/runner/work/mitra/mitra/src/behavior/behavior-definition.ts` | static behavior metadata contract (priority/weight/cooldown/action) |
| `/home/runner/work/mitra/mitra/src/behavior/behavior-engine.ts` | behavior selection algorithm (eligibility, cooldown, priority bracket, weighted random, recency penalty) |
| `/home/runner/work/mitra/mitra/src/behavior/idle-behavior.ts` | base idle behavior utility |
| `/home/runner/work/mitra/mitra/src/behavior/index.ts` | exports |

### Behavior chains

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/behavior/chains/behavior-chains.ts` | reminder anticipation chain scripts (multi-step animation/bubble/emotion recipes) |

### Concrete behaviors (`/home/runner/work/mitra/mitra/src/behavior/behaviors`)

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/idle.ts` | ambient idle loop behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/blink.ts` | blink behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/look-around.ts` | look-around ambient behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/stretch.ts` | stretch behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/sleep.ts` | sleep transition behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/walk.ts` | walk behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/observe.ts` | observe behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/yawn.ts` | yawn behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/wake.ts` | wake behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/look-at-cursor.ts` | cursor-facing behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/boot-greet.ts` | startup greeting behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/sit.ts` | sit behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/battery.ts` | low-battery contextual behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/battery-full.ts` | charged/battery full contextual behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/time-routine.ts` | time-of-day reactions |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/weather.ts` | weather-driven behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/meeting-hide.ts` | high-priority hide/show behavior during meetings |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/presence-lie-down.ts` | presence posture when idle stage = lying |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/presence-watch-cursor.ts` | watch-cursor state behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/presence-follow-cursor.ts` | follow-cursor state behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/presence-peek.ts` | peek state behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/presence-wander.ts` | wander state behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/presence-taskbar.ts` | default taskbar-present behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/catch-up.ts` | post-hidden summary behavior for missed reminders |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/user-birthday.ts` | user birthday behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/mitra-birthday.ts` | companion birthday behavior |
| `/home/runner/work/mitra/mitra/src/behavior/behaviors/index.ts` | behavior exports (also re-exports reminder behaviors from brain/reminders) |

## 4.4 `/home/runner/work/mitra/mitra/src/body`

| File | Purpose | Lifecycle/Notes |
|---|---|---|
| `/home/runner/work/mitra/mitra/src/body/Companion.tsx` | renderer switch abstraction (`mock`, planned `rive/svg`) | host-level component |
| `/home/runner/work/mitra/mitra/src/body/MockRenderer.tsx` | full SVG companion and interaction hit targets | main visual runtime surface |
| `/home/runner/work/mitra/mitra/src/body/useAnimationRig.ts` | spring-physics rig values and frame loop | frame-level updates |
| `/home/runner/work/mitra/mitra/src/body/PlaceholderRenderer.tsx` | fallback renderer | non-primary path |
| `/home/runner/work/mitra/mitra/src/body/types.ts` | renderer config/types | contract |
| `/home/runner/work/mitra/mitra/src/body/index.ts` | exports | module convenience |
| `/home/runner/work/mitra/mitra/src/body/Companion.css` | component-level styles | render styling |
| `/home/runner/work/mitra/mitra/src/body/MockRenderer.css` | detailed animation/styling classes | render styling |

## 4.5 `/home/runner/work/mitra/mitra/src/system`

| File | Purpose | Lifecycle | Dependencies |
|---|---|---|---|
| `/home/runner/work/mitra/mitra/src/system/environment.ts` | Environment snapshot/service contracts and privacy constraints | static contract | none |
| `/home/runner/work/mitra/mitra/src/system/environment-service.ts` | DOM and screen sensor implementation | create in App, dispose on unmount | Tauri invoke fallback + browser APIs |
| `/home/runner/work/mitra/mitra/src/system/scheduler.ts` | centralized scheduling service | create once, dispose once | JS timers |
| `/home/runner/work/mitra/mitra/src/system/event-bus.ts` | typed event bus contract | static | TS types |
| `/home/runner/work/mitra/mitra/src/system/event-bus-impl.ts` | asynchronous microtask event bus implementation | create once, clear on unmount | Map/Set + queueMicrotask |
| `/home/runner/work/mitra/mitra/src/system/window-controller.ts` | window control interface | static contract | none |
| `/home/runner/work/mitra/mitra/src/system/window-controller-impl.ts` | Tauri window implementation with persisted position restore | app lifecycle + dispose | tauri window APIs + app storage |
| `/home/runner/work/mitra/mitra/src/system/executors.ts` | applies intents to engine/window/audio | called every brain act | companion engine + window controller + audio |
| `/home/runner/work/mitra/mitra/src/system/audio-system.ts` | sound preload/cooldowns/quiet-hours playback | instantiate in App | WebAudio + event bus prefs |
| `/home/runner/work/mitra/mitra/src/system/sound-manager.ts` | context-aware ambient/foley sound policy | called during brain think/tick | audio-system |
| `/home/runner/work/mitra/mitra/src/system/battery-system.ts` | navigator battery API wrapper | start/dispose | browser battery APIs |
| `/home/runner/work/mitra/mitra/src/system/weather-system.ts` | weather state fetch and interpretation | start/dispose | trust manager + fetch |
| `/home/runner/work/mitra/mitra/src/system/meeting-system.ts` | periodic meeting/coding status via Tauri commands | start with scheduler, dispose | tauri invoke + scheduler |
| `/home/runner/work/mitra/mitra/src/system/git-watcher.ts` | polls git hash and emits commit celebration callback | start/stop | tauri invoke + interval |
| `/home/runner/work/mitra/mitra/src/system/trust-manager.ts` | trust preference adapter | app lifecycle service | app storage |
| `/home/runner/work/mitra/mitra/src/system/notification-system.ts` | hidden-mode queue and resurface toast summary | app lifecycle service | toast callback abstraction |
| `/home/runner/work/mitra/mitra/src/system/idle-detection.ts` | idle detection contracts/helpers | utility layer | none |
| `/home/runner/work/mitra/mitra/src/system/index.ts` | system exports | build-time | TS module system |

## 4.6 `/home/runner/work/mitra/mitra/src/storage`

| File | Purpose | Interaction |
|---|---|---|
| `/home/runner/work/mitra/mitra/src/storage/storage.ts` | generic storage interface | backend abstraction |
| `/home/runner/work/mitra/mitra/src/storage/browser-storage.ts` | localStorage backend implementation | used by app-storage |
| `/home/runner/work/mitra/mitra/src/storage/memory-storage.ts` | in-memory storage backend | test/dev path |
| `/home/runner/work/mitra/mitra/src/storage/app-storage.ts` | app preferences storage + migration and event publish | central persistence gateway |
| `/home/runner/work/mitra/mitra/src/storage/index.ts` | exports | import convenience |

## 4.7 `/home/runner/work/mitra/mitra/src/plugin`

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/plugin/types.ts` | plugin manifest/API/permission and behavior contracts |
| `/home/runner/work/mitra/mitra/src/plugin/plugin-manager.ts` | plugin loading/unloading and registry management |
| `/home/runner/work/mitra/mitra/src/plugin/index.ts` | exports |

### Plugin examples (`/home/runner/work/mitra/mitra/src/plugin/examples`)

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/plugin/examples/hello-world-plugin.ts` | minimal lifecycle + intent emit example |
| `/home/runner/work/mitra/mitra/src/plugin/examples/daily-greeting.ts` | scheduled greeting pattern example |
| `/home/runner/work/mitra/mitra/src/plugin/examples/git-integration.ts` | git-aware plugin integration example |
| `/home/runner/work/mitra/mitra/src/plugin/examples/media-integration.ts` | media event reaction plugin example |

## 4.8 `/home/runner/work/mitra/mitra/src/types`

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/types/animation.ts` | animation enum |
| `/home/runner/work/mitra/mitra/src/types/emotion.ts` | emotion enum |
| `/home/runner/work/mitra/mitra/src/types/interaction.ts` | interaction enum |
| `/home/runner/work/mitra/mitra/src/types/intent.ts` | semantic intent union |
| `/home/runner/work/mitra/mitra/src/types/world.ts` | world state aggregate |
| `/home/runner/work/mitra/mitra/src/types/character.ts` | character aggregate model |
| `/home/runner/work/mitra/mitra/src/types/preferences.ts` | persisted preference schema + defaults |
| `/home/runner/work/mitra/mitra/src/types/position.ts` | position model |
| `/home/runner/work/mitra/mitra/src/types/movement.ts` | movement intent types |
| `/home/runner/work/mitra/mitra/src/types/index.ts` | canonical type barrel |

## 4.9 `/home/runner/work/mitra/mitra/src/components`

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/components/Updater.tsx` | update check/install/relaunch toast workflow |
| `/home/runner/work/mitra/mitra/src/components/Updater.css` | updater styles |
| `/home/runner/work/mitra/mitra/src/components/SettingsPanel.css` | settings panel styles |

## 4.10 `/home/runner/work/mitra/mitra/src/ui`

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/ui/StateDebug.tsx` | debug visualization of character state |
| `/home/runner/work/mitra/mitra/src/ui/StateDebug.css` | debug styling |
| `/home/runner/work/mitra/mitra/src/ui/index.ts` | exports |

## 4.11 Other source root files

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src/main.tsx` | frontend entrypoint and page switch |
| `/home/runner/work/mitra/mitra/src/vite-env.d.ts` | Vite TS declarations |

---

## 5. Native Host (`/home/runner/work/mitra/mitra/src-tauri`) Module Catalog

## 5.1 Build/Config

| File | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/src-tauri/Cargo.toml` | Rust dependency and crate config |
| `/home/runner/work/mitra/mitra/src-tauri/Cargo.lock` | locked crate versions |
| `/home/runner/work/mitra/mitra/src-tauri/build.rs` | tauri build script |
| `/home/runner/work/mitra/mitra/src-tauri/tauri.conf.json` | window definitions, CSP, bundling, updater endpoint |
| `/home/runner/work/mitra/mitra/src-tauri/capabilities/default.json` | capability permissions for windows and plugins |
| `/home/runner/work/mitra/mitra/src-tauri/.gitignore` | build artifacts ignore |

## 5.2 Rust runtime modules

| File | Purpose | Notes |
|---|---|---|
| `/home/runner/work/mitra/mitra/src-tauri/src/main.rs` | binary entrypoint | delegates to library run |
| `/home/runner/work/mitra/mitra/src-tauri/src/lib.rs` | app builder, invoke handler registration, plugin setup | central native runtime bootstrap |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/mod.rs` | system module exports | namespacing |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/window.rs` | initial bottom-right positioning | startup UX placement |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/tray.rs` | tray menu actions and window toggles | primary user control surface |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/screen.rs` | command for screen geometry and monitor count | consumed by environment service |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/meeting.rs` | process scan + throttled cache for meeting/coding detection | performance-sensitive integration |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/media.rs` | Windows media session listener and event bridge | windows-only branch |
| `/home/runner/work/mitra/mitra/src-tauri/src/system/git.rs` | current git hash command | polled by git watcher |
| `/home/runner/work/mitra/mitra/src-tauri/src/bin/test_media.rs` | standalone media test harness with OS cfg guards | non-production utility |

## 5.3 Assets and icons

- `/home/runner/work/mitra/mitra/src-tauri/icons/**` contains platform icon assets (desktop/android/ios variants).
- These are build/package resources, not runtime logic modules.

---

## 6. Public Assets (`/home/runner/work/mitra/mitra/public`)

| Path | Purpose |
|---|---|
| `/home/runner/work/mitra/mitra/public/icon.png` | app icon used in onboarding UI and branding |
| `/home/runner/work/mitra/mitra/public/mitra_banner.png` | readme/marketing banner |
| `/home/runner/work/mitra/mitra/public/sounds/*` | runtime audio files loaded by `audio-system.ts` |

Audio files are selected by category map in `/home/runner/work/mitra/mitra/src/system/audio-system.ts`.

---

## 7. Execution Flow Details

## 7.1 Observe -> Think -> Act Pipeline

### Observe phase (`brain.observe()`)

Inputs:

- environment snapshot from `/home/runner/work/mitra/mitra/src/system/environment-service.ts`
- meeting state from `/home/runner/work/mitra/mitra/src/system/meeting-system.ts`
- battery/weather state overlays

Outputs:

- refreshed `WorldState`
- wake/sleep adjustments
- presence state update

### Think phase (`brain.think()`)

Steps:

1. update context state (time/day/meeting/coding synthesis)
2. tick emotion decay
3. tick reminder lifecycle
4. adapt personality based on idle level
5. generate occasional delight events
6. select behavior via behavior engine
7. execute behavior to emit intents
8. expand celebration intents
9. convert intents to animation director sequences
10. tick animation director to produce final procedural state and bubble
11. generate sound cues

### Act phase (`brain.act()`)

1. apply intent-level emotion/procedural merges
2. run `/home/runner/work/mitra/mitra/src/system/executors.ts`
3. commit final state into companion engine store
4. clear intent queue

## 7.2 Reminder flow internals

- Scheduling and trigger logic in `/home/runner/work/mitra/mitra/src/brain/reminders/reminder-engine.ts`
- Reminder behavior wrappers emit `SetInteraction(reminder:*)`
- `/home/runner/work/mitra/mitra/src/behavior/chains/behavior-chains.ts` chooses animation chain variant
- Renderer bubble click dispatches `companion:reminder:ack`
- `brain.acknowledgeReminder()` updates memory/habits and clears active sequence

## 7.3 Meeting hide and catch-up flow

- Meeting detection command in Rust via `check_meeting_status`
- JS meeting system polls every 30s via scheduler
- `MeetingHideBehavior` emits `HideWindow` / `ShowWindow`
- Deferred reminders recorded in memory meeting tracker
- On return, `CatchUpBehavior` summarizes missed reminders and emits encouraging bubble

---

## 8. Dependency Hotspots and Coupling Notes

## 8.1 High-coupling modules

1. `/home/runner/work/mitra/mitra/src/app/App.tsx`
   - Coupled to almost every runtime service.
   - Treat as composition root; avoid business logic growth.

2. `/home/runner/work/mitra/mitra/src/brain/brain.ts`
   - Core orchestrator and integration pivot.
   - Any semantic model drift should be reviewed here first.

3. `/home/runner/work/mitra/mitra/src/body/MockRenderer.tsx`
   - Large interactive surface with many gesture event hooks.
   - Refactoring should preserve event contract names.

## 8.2 Stability-critical contracts

- `Intent` union in `/home/runner/work/mitra/mitra/src/types/intent.ts`
- `AppPreferences` schema in `/home/runner/work/mitra/mitra/src/types/preferences.ts`
- `CompanionMemory` schema in `/home/runner/work/mitra/mitra/src/brain/memory.ts`

Changes to these should be staged with migration/backward compatibility review.

---

## 9. Ownership Model (Suggested)

| Area | Primary Owner | Secondary Owner |
|---|---|---|
| `/home/runner/work/mitra/mitra/src/brain` | Companion Intelligence | Runtime Platform |
| `/home/runner/work/mitra/mitra/src/behavior` | Companion Intelligence | Product Surface |
| `/home/runner/work/mitra/mitra/src/body` | Motion/Rendering | Product Surface |
| `/home/runner/work/mitra/mitra/src/system` | Runtime Platform | Native Runtime |
| `/home/runner/work/mitra/mitra/src-tauri/src/system` | Native Runtime | Runtime Platform |
| `/home/runner/work/mitra/mitra/src/storage` | Runtime Platform | Product Surface |
| `/home/runner/work/mitra/mitra/src/plugin` | Ecosystem/Platform | Security |
| `/home/runner/work/mitra/mitra/src/app` | Product Surface | Runtime Platform |

---

## 10. Change Impact Playbook

## 10.1 If changing reminders

Touchpoints:

- `/home/runner/work/mitra/mitra/src/brain/reminders/reminder-engine.ts`
- `/home/runner/work/mitra/mitra/src/brain/reminders/*.ts`
- `/home/runner/work/mitra/mitra/src/behavior/chains/behavior-chains.ts`
- `/home/runner/work/mitra/mitra/src/types/preferences.ts`
- `/home/runner/work/mitra/mitra/src/app/SettingsPage.tsx`

## 10.2 If changing interactions

Touchpoints:

- `/home/runner/work/mitra/mitra/src/body/MockRenderer.tsx`
- `/home/runner/work/mitra/mitra/src/app/App.tsx` event handlers
- `/home/runner/work/mitra/mitra/src/brain/interaction-engine.ts`
- `/home/runner/work/mitra/mitra/src/types/interaction.ts`

## 10.3 If changing native process detection

Touchpoints:

- `/home/runner/work/mitra/mitra/src-tauri/src/system/meeting.rs`
- `/home/runner/work/mitra/mitra/src/system/meeting-system.ts`
- behavior reaction modules (`meeting-hide`, `catch-up`)

## 10.4 If changing animation behavior

Touchpoints:

- `/home/runner/work/mitra/mitra/src/brain/core/animation-director.ts`
- `/home/runner/work/mitra/mitra/src/body/useAnimationRig.ts`
- `/home/runner/work/mitra/mitra/src/body/MockRenderer.tsx`
- emotion derivation in `/home/runner/work/mitra/mitra/src/brain/core/emotion-engine.ts`

---

## 11. Common Pitfalls for New Engineers

1. Treating `App.tsx` as a logic dump instead of a composition root.
2. Bypassing intents and mutating state directly from behaviors.
3. Forgetting disposal/unlisten for listeners and intervals.
4. Adding reminder types without updating preference schema and behavior chains.
5. Breaking interaction event names expected by `App.tsx` listeners.
6. Adding native capabilities without updating `/home/runner/work/mitra/mitra/src-tauri/capabilities/default.json`.

---

## 12. Quick “Explain Any Part” Cheat Sheet

- **Where does logic live?** `/home/runner/work/mitra/mitra/src/brain` + `/home/runner/work/mitra/mitra/src/behavior`
- **Where are side effects executed?** `/home/runner/work/mitra/mitra/src/system/executors.ts`
- **Where is rendering controlled?** `/home/runner/work/mitra/mitra/src/body/MockRenderer.tsx` + `useAnimationRig.ts`
- **Where are reminders scheduled?** `/home/runner/work/mitra/mitra/src/brain/reminders/reminder-engine.ts`
- **Where is meeting status detected?** `/home/runner/work/mitra/mitra/src-tauri/src/system/meeting.rs`
- **Where is window/tray behavior?** `/home/runner/work/mitra/mitra/src-tauri/src/system/tray.rs`
- **Where are preferences stored?** `/home/runner/work/mitra/mitra/src/storage/app-storage.ts`
- **Where is plugin lifecycle?** `/home/runner/work/mitra/mitra/src/plugin/plugin-manager.ts`

---

## 13. Recommended Next Documentation Extensions

1. Add architecture decision records (ADRs) for key choices:
   - tick orchestration
   - intent model
   - procedural animation approach
2. Add sequence snapshots for onboarding and update flows.
3. Add explicit test strategy matrix aligned per module.
4. Add runbooks for debugging reminder timing and meeting false positives.

---

## 14. Final Notes

This codebase is architected around a clear mental model:

- Sense environment
- Decide behavior
- Emit intents
- Execute effects
- Render companion state

When debugging, always locate the issue in that chain first; then inspect the exact module in this guide.

