# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.0] - The Spotlight Update

### 🚀 Features & Enhancements
- **🔍 Universal Spotlight Command Palette**: Upgraded the command bar into a Raycast/Spotlight-style universal palette. It supports dynamic action registration, history navigation (using Arrow Up/Down keys), autocomplete suggestions (e.g. typing `water` suggests `💧 Drink Water`), and a keyboard toggle shortcut (`Ctrl + K` or `/`).
- **🛡️ Fuzzy Clash Detection**: Prevents the creation of custom reminders that clash with built-in reminders (e.g. blocking posture, coffee/water, breaks, or meal keywords) with a guidance notice.
- **↩️ Gmail-style Undo Action**: Shows a stateful Toast notification with a 3-second undo buffer when a reminder is scheduled, with a happy chirp sound and Mitra smiling face feedback.
- **🔍 Settings Panel Filtering**: Added a search bar at the top of the Settings Page to dynamically filter sections (reminders, audio, privacy, etc.) based on keywords.
- **🛡️ Strict Focus & Close Gestures**: Stopped the Command Bar from opening automatically on general Alt+Tab window focus. Closed the bar strictly on Escape, submit, close button, or clicking outside (eliminating unreliable blur events).
- **🔒 Safety Hardening**: Upgraded safety validators to normalize strings (collapsing spaces, stripping symbols, mapping leet-speak) to block obfuscated prompts.

### 🛠️ Performance & Stability (The Deep Pass)
- **⚡ Atomic Engine Updates**: Replaced multiple engine setter calls in the core brain loop with a single `batchUpdate()`. This eliminates up to 8 unnecessary React re-renders per second, making Mitra buttery smooth.
- **🚫 Zero IPC Noise**: Rewrote the Context Engine to read meeting state synchronously from the scheduler, dropping duplicate 10s IPC polling intervals and loose async promises.
- **🔕 Console Flash Fixed**: The Git watcher now probes for a repo at startup and cleanly aborts in production environments, permanently eliminating the "flashing Windows Terminal" issue caused by background child processes.
- **👻 Transparent Window Fixes**: Guarded all `hide()` and `show()` window commands with visibility checks. Cleared click-through states before hiding to prevent the WebView2 compositor from repainting black rectangles.
- **🔒 Serialized IPC Queue**: All Tauri window movement and state operations are now funneled through a strict serial promise queue, preventing "Not Responding" hangs when the UI thread was overwhelmed.
- **🚫 React StrictMode Guard**: Disabled React 18 StrictMode in production to prevent the entire companion engine and IPC listeners from mounting twice and competing.

## [v1.0.0] - The Final Production Release

### 🚀 Features & Enhancements
- **🧠 Behavior Chains & Anticipation**: Smooth, natural anticipatory transitions before any dialogue bubble appears (looking around, stretching, yawning) with polite cancellation if you become active.
- **✨ Dynamic Props & Costumes**: Stalk of bamboo (food) during meal times, laptop when coding, beach towel/sunglasses for sunny weather, umbrella for rain, coffee/tea mug for water breaks, and birthday hat/cake for celebrations.
- **🎂 Birthday & Age Wishes**: Storing birth year correctly, computing age, and greeting you with a custom age wish.
- **🖥️ DPI & Resolution Recovery**: Added window resize tracking to `EnvironmentService` to dynamically query and update screen geometry, DPI, and monitor count.
- **📝 Custom Reminders & Command Bar**: Schedule custom reminders using natural language (e.g. *"medicine in 30m"*, *"coffee every 45m"*, or *"lunch at 1:30 PM"*). Live parsing previews show up as you type.
- **🛡️ Safety Guardrails**: Prohibits self-harm, violent, and illegal reminder schedules. Intercepted inputs trigger supportive or cautionary speech bubbles and concerned emotional face shifts.

### 🐛 Bug Fixes
- **Event & Timeout Leaks**: Closed critical event listener leaks (arrow function removal in `App.tsx` and re-render creation in `SettingsPage.tsx`). Implemented a timeout tracker in `Updater.tsx` to clear scheduled timeouts on unmount.
- **Subsystem Lifecycle Disposal**: Added native `.dispose()` lifecycle callbacks to `AppStorage`, `WeatherSystem`, `BatterySystem`, and `WindowController` to unsubscribe from listeners/intervals.
- **Plugin Lifecycle Leaks**: Implemented automatic registry and subscription cleanup when unloading plugins in `plugin-manager.ts` and triggered `_pluginManager.unloadAll()` on root unmount.
- **Cross-Platform Compatibility**: Resolved OS-specific process suffix assumptions in Rust `meeting.rs` to support cross-platform Zoom/Teams matching.
- **macOS & Linux Compilation**: Added target conditional compilation guards to `test_media.rs` and added `libgtk-3-dev` to the Linux CI runner, resolving build failures on non-Windows targets caused by missing Windows-only dependencies.
- **Tauri IPC Capabilities**: Added missing window management IPC capabilities to `default.json` preventing production runtime crashes.
- **Food Prop Rotations & Layering**: Swapped inverted arm rotation signs for the food prop and adjusted SVG layering order to make the bamboo prop visible.
- **Speech Bubble Race Conditions**: Replaced unmanaged speech bubble `setTimeout` callbacks with a centralized `AnimationDirector` queue.

## [v0.2.0] - The Companion Update (Product Hunt Launch)

### 🚀 Features & Enhancements
- **Media Reactions (Windows)**: Mitra now listens to your music via Windows Global System Media Transport Controls (`win-gsmtc`). She knows what you're listening to and will vibe with you!
- **Context Awareness (Meetings & Coding)**: Mitra smartly detects when you're in a meeting (Zoom, Teams, Discord, etc.) to give you privacy, and detects when you're coding (VS Code, JetBrains) to quietly cheer you on. 

### 🐛 Bug Fixes
- **System Tray Stability**: Fixed an issue with the Tauri tray menu method causing build failures.
- **Media API & Lifetimes**: Resolved Rust compilation errors (`E0432`, `E0106`) by upgrading to the latest `gsmtc` crate API and fixing missing lifetime specifiers for `sysinfo` state management.

## [v0.1.0] - Initial Launch Release
### 🚀 Features & Enhancements
- **Procedural Animation Engine**: Introduced a dynamic skeletal rig (`useAnimationRig.ts`) that smoothly interpolates between different postures and moods, giving Mitra a lifelike presence.
- **Expressive Moods**: Added new facial expressions including `happy-closed` (^ ^), `sad` (drooping eyelids), `yawn` (wide mouth), and `smirk`.
- **Lifelike Postures**: Implemented custom interactive postures like `thinking`, `shy`, `concerned`, and `cheer`.
- **Dynamic Action Bubbles**: Mitra can now communicate contextually with floating speech bubbles that respond to user interactions (e.g. reminders, greetings).

### 🎨 UI & Rendering Fixes
- **Accurate Anatomical Posing**: Completely overhauled the `sit` posture so Mitra sits correctly on her rump with forepaws supporting her weight and hind legs folded naturally, mimicking a real red panda.
- **Layering & Transforms**: Fixed extreme SVG scaling and incorrect pivot points in the procedural animation rig, ensuring limbs rotate predictably without unnatural distortion or sticker-like flatness.
- **Micro-interactions**: Added subtle idle animations (breathing, ear twitches, and lazy tail wags) to keep the companion feeling alive on the desktop.

### 🔒 Security & Architecture
- **Tauri v2 Migration**: Successfully migrated build targets and dependencies to Tauri v2.
- **Content Security Policy (CSP)**: Hardened the `tauri.conf.json` CSP to strictly limit external connections, ensuring the app remains secure and isolated.
- **Scoped Capabilities**: Restricted IPC commands using Tauri v2 capabilities (`default.json`), only allowing essential window control APIs and minimizing the attack surface.
- **CI/CD Pipeline**: Fixed the GitHub Actions `release.yml` workflow, updating the runner to `ubuntu-22.04`, switching to the required `libwebkit2gtk-4.1-dev` dependency for Tauri v2, and adding necessary `contents: write` permissions for automated release generation.
