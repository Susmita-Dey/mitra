# Environment Service

> Internal technical specification for `src/system/environment-service.ts`.
> For engineers working on behavior conditions or adding new system signals.

---

## Overview

The Environment Service is a lightweight observer that captures a snapshot of the user's OS environment on every Brain tick. It gives behaviors the contextual information they need to make decisions (e.g., "is the user away?" → trigger sleep) without ever reading personal content.

---

## Privacy Contract

The Environment Service deliberately **does not collect**:

- Mouse coordinates or cursor position
- Key values, sequences, or any keyboard content
- Focused application name or window title
- URLs, file names, or document content
- Any data that could identify or profile a user

It **does collect**:

- Time elapsed since the last input event (mouse or keyboard)
- Binary presence flags: `mouseActive`, `keyboardActive`, `windowFocused`, `cursorInWindow`
- Primary monitor pixel dimensions (integers)
- Device pixel ratio
- Number of connected monitors (count only)

---

## Signals

### Input Timing (frontend DOM)

| Signal | Source | Description |
|---|---|---|
| `mouseIdleMs` | `mousemove` timestamp | Time since last mouse movement |
| `keyboardIdleMs` | `keydown` timestamp | Time since last key press |
| `idleMs` | `min(mouse, keyboard)` | Effective idle time |
| `mouseActive` | Per-tick flag | Did mouse move this tick? (resets each call) |
| `keyboardActive` | Per-tick flag | Was a key pressed this tick? (resets each call) |
| `windowFocused` | `focus`/`blur` events | Does the Mitra webview have OS focus? |
| `cursorInWindow` | `mouseenter`/`mouseleave` | Is the cursor inside the Mitra window? |

**Self-resetting tick flags:** `mouseActive` and `keyboardActive` are reset to `false` after each `getSnapshot()` call. This ensures each Brain tick receives a clean, accurate 1-second observation window — not accumulated state.

### Screen / Monitor (Tauri Rust command)

| Signal | Source | Description |
|---|---|---|
| `screenWidth` | `get_screen_info` Tauri command | Primary monitor width (physical px) |
| `screenHeight` | `get_screen_info` Tauri command | Primary monitor height (physical px) |
| `devicePixelRatio` | `get_screen_info` Tauri command | Scale factor (e.g. 1.0, 1.5, 2.0) |
| `monitorCount` | `get_screen_info` Tauri command | Number of connected displays |

Screen info is fetched **once on startup** asynchronously. Until the Tauri call resolves, `window.screen` values are used as a fallback. Outside Tauri (e.g., Vite dev browser), the fallback is always used.

---

## Data Flow

```
DOM events
  └── onMouseMove, onKeyDown, onFocus/Blur, onMouseEnter/Leave
        │
        ▼
EnvironmentService (internal state)
  └── getSnapshot() → EnvironmentSnapshot
                            │
                            ▼
                    Brain.observe()
                            │
                            ▼
                    BehaviorContext.environment
                            │
                            ▼
                 behavior.canExecute(context)
                 behavior.execute(context)
```

---

## How Behaviors Use It

Read `context.environment` inside `canExecute` or `execute`:

```typescript
// Sleep behavior — gate on idle time
canExecute: (context) =>
  context.environment.idleMs > 15 * 60 * 1000,  // 15 minutes

// Observe behavior — gate on cursor presence
canExecute: (context) =>
  context.environment.cursorInWindow,

// Look-around — suppress when user is actively typing
canExecute: (context) =>
  !context.environment.keyboardActive,
```

Behaviors should **never** hold a reference to the EnvironmentService itself. The snapshot injected into the context is the only permitted access point.

---

## Lifecycle

```
createEnvironmentService()       → attaches DOM listeners, starts Tauri fetch
brain.observe()                  → calls getSnapshot() once per tick
brain + env disposed on unmount  → env.dispose() removes all listeners
```

Call `dispose()` when the app unmounts to prevent listener leaks.

---

## Rust Command: `get_screen_info`

Registered in `src-tauri/src/lib.rs`. Implementation in `src-tauri/src/system/screen.rs`.

Returns:
```json
{
  "width": 2560,
  "height": 1440,
  "devicePixelRatio": 1.5,
  "monitorCount": 2
}
```

Falls back to zero values if no monitor is detected.

---

## Files

| File | Role |
|---|---|
| `src/system/environment.ts` | `EnvironmentSnapshot` and `EnvironmentService` interfaces |
| `src/system/environment-service.ts` | Production implementation (DOM listeners + Tauri) |
| `src-tauri/src/system/screen.rs` | Rust `get_screen_info` Tauri command |
| `src-tauri/src/lib.rs` | Command registration |
| `src/behavior/behavior.ts` | `BehaviorContext.environment` field |
| `src/brain/brain.ts` | `observe()` calls `getSnapshot()` and stores current snapshot |
