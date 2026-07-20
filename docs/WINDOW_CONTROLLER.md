# Window Controller

> Internal technical specification for `src/system/window-controller-impl.ts`.

---

## Overview

The Window Controller acts as a low-level bridge between the Tauri native window APIs and Mitra's frontend.

Crucially, **the Window Controller contains zero business logic**. It does not decide *when* Mitra moves, *why* she moves, or *what* she does. It strictly executes raw window operations requested by higher-level systems (primarily the Brain).

## Thread Ownership & Responsibilities

1. **Behaviors**: Decide what they want to do. They emit a `MovementIntent` (e.g., `snap-to-edge`, `move-to`, `drag`) via the `BehaviorContext`.
2. **The Brain**: Reviews pending intents at the end of each `think()` cycle. It acts as the gatekeeper. For example, if a behavior requests movement but the Brain knows Mitra is in a sticky `sleepy` state, it can reject the intent. Valid intents are forwarded to the Window Controller.
3. **The Window Controller**: Executes the actual OS commands (e.g., `win.setPosition()`, `win.startDragging()`). It also listens to native events (like `onMoved`) to persist position independently.

This strict separation ensures the companion logic remains fully platform-agnostic and unit-testable.

---

## Multi-Monitor Support & Persistence

Mitra uses the project's generic `Storage` service to persist her location.

When the application boots:
1. `restorePosition()` attempts to load `mitra_window_position`.
2. It fetches all currently connected physical monitors via Tauri.
3. **Bounds Checking**: It calculates if the saved `(x, y)` coordinates fall inside *any* currently connected monitor.
4. **Fallback**: If the coordinates are orphaned (e.g., the user unplugged the external monitor Mitra was living on), the controller discards the saved position and recalculates the default: the bottom-right corner of the **primary** monitor, leaving a 16px padding so she doesn't clip into the taskbar.

---

## Capabilities (Prepared Interfaces)

The interface prepares several extension points for Phase 3:

- `moveTo(x, y)`: Immediate teleportation.
- `animateTo(x, y)`: Smooth interpolation (stubbed for future animation logic).
- `snapToEdge()`: Dynamically calculates distances to the 4 edges of the *current* monitor (accounting for monitor offset) and snaps to the closest one.
- `startDrag()`: Hands control to the OS for native dragging.
- `setAlwaysOnTop()`
- `hide()`, `show()`, `minimize()`, `restore()`
- `setIgnoreCursorEvents()`: Prepared for future "click-through" modes.

## Files

| File | Role |
|---|---|
| `src/system/window-controller.ts` | The pure interface |
| `src/system/window-controller-impl.ts` | Implementation using `@tauri-apps/api/window` |
| `src/types/movement.ts` | `MovementIntent` definitions |
| `src/behavior/behavior.ts` | Extends `BehaviorContext` with `requestMovement()` |
| `src/brain/brain.ts` | Gatekeeps and processes intents |
