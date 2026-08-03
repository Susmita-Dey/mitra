## Summary

This PR introduces custom reminders via a floating natural language Command Bar, integrates local content safety validation guardrails (intercepting crisis, violence, and illegal prompts with empathetic reactions), fixes critical timeout/plugin memory leaks, and documents the overall project architecture and SDLC methodology.

## Type of Change

- [x] 🐛 Bug fix (non-breaking)
- [x] ✨ New feature (non-breaking)
- [ ] 💥 Breaking change
- [ ] 🔌 New plugin
- [x] 🎨 UI / Animation change
- [x] 📖 Documentation update
- [x] 🔧 Refactor / internal cleanup
- [x] 🔒 Security fix

## Related Issue

Closes all user feature requests for custom reminders, safety, memory profiling, and SDLC documentation updates.

## What changed?

- **Natural Language Parsing & Safety** (`src/system/reminder-parser.ts`):
  - Created a deterministic natural language parser supporting countdowns (*"in 30m"*), daily clock time (*"at 1:30 PM"*), and intervals (*"every 1h"*).
  - Built an offline safety validator (`checkSafety`) checking for self-harm/crisis, violence/weapons, and illegal activities (drugs/hacking). Strips HTML/script tags and truncates inputs to 120 characters to block XSS and storage exhaustion.
- **Custom Reminder Engines & Behaviors** (`src/brain/reminders/`):
  - Created `custom-reminder.ts` behavior wrapper.
  - Extended `reminder-engine.ts` to coordinate custom interval/time ticks and prevent stampedes.
  - Configured `brain.ts` to bind storage, clean up one-shot timers on ack, and dynamically select emotion/prop chains (e.g. coffee mug for `coffee`, stretching pose for `posture`).
- **Interactive Interface & Management**:
  - `src/app/App.tsx`: Wires the glassmorphic `CommandBar` component floating at the bottom with live scheduling previews. Intercepts unsafe inputs to trigger concerned/supportive speech bubbles.
  - `src/app/SettingsPage.tsx`: Integrates a **Custom Reminders** section to display active custom reminders, toggle their active state, or permanently delete them with database sync.
- **Memory Leak Resolution**:
  - `src/components/Updater.tsx`: Implemented a `timeoutsRef` hook to track and clear all scheduled update check/message timers on unmount.
  - `src/app/App.tsx`: Ensures all active plugins are unloaded via `_pluginManager.unloadAll()` on window unmount.
- **Architecture & Lifecycle Documentation**:
  - `MITRA_CAPSTONE_PROJECT_REPORT.md` & `MITRA_ARCHITECTURE_GUIDE.md`: Documented the new safety mechanisms, module paths, and added the Software Development Lifecycle (SDLC) Evolutionary Prototyping model and Mermaid flowcharts.
  - `release_notes.md`, `README.md`, `CHANGELOG.md`, `FINAL_PRODUCTION_VERIFICATION.md`: Updated feature details, changelogs, and verified blocker items.

## Does Mitra feel more alive because of this?

Yes! By talking to Mitra via the Command Bar, she feels more interactive. Most importantly, she acts as a true companion—intercepting harmful or self-deprecating prompts to express concerned emotions 🥺 and offering kind, supportive words or helpline info.

## Testing Done

- [x] Ran `bunx tauri dev` and manually verified the change
- [x] `bunx tsc --noEmit` passes (zero TypeScript errors)
- [x] `bun run build` succeeds
- [x] Tested on Windows (required for release)

## Plugin changes (if applicable)

- [ ] I have read [PLUGIN_CONTRIBUTING.md](../PLUGIN_CONTRIBUTING.md)
- [ ] Security self-review complete (no `eval`, `innerHTML`, `setInterval`)
- [ ] Manifest permissions match actual usage

## Screenshots / Recordings

*(Drag and drop screenshots of the floating Command Bar, the Custom Reminders dashboard under Settings, or Mitra's concerned reaction to blocked prompts here.)*

## Breaking Changes

None.
