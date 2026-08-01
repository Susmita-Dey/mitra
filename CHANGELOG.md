# Changelog

All notable changes to this project will be documented in this file.

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
