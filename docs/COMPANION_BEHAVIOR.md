# Companion Behavior Architecture

This document defines how Mitra's `Brain` selects and executes behaviors, and how those behaviors map to the `CompanionEngine` state.

## 1. The Behavior Loop

Mitra's brain runs on a continuous perception cycle:
1. **`observe()`**: Gathers data from the `System` layer (Clock, IdleDetection, Battery, OS Window).
2. **`think()`**: Evaluates the list of registered `Behavior` objects.
3. **`act()`**: Executes the chosen behavior by updating the `CompanionEngine` state.

## 2. Behavior Interface

```typescript
interface Behavior {
  id: string;
  priority: number;
  canExecute(context: BehaviorContext): boolean;
  execute(context: BehaviorContext): void;
}
```

### Priority Hierarchy
Behaviors are evaluated strictly by priority (highest number wins).

- **100+ (Critical)**: OS triggers (e.g., low battery, dragging the window).
- **50-99 (Active)**: Reminders (e.g., stretch reminder, water reminder).
- **10-49 (Reactive)**: User interaction (e.g., poking, hovering).
- **0-9 (Ambient)**: Idle states (e.g., sleeping, looking around).

## 3. Standard Behaviors

### The "Idle" Behavior (Priority 0)
The ultimate fallback. If no other behavior returns `true` for `canExecute()`, the Idle behavior runs.
- **Action**: Sets `animation: "idle"`, `emotion: "neutral"`.

### The "Sleep" Behavior (Priority 5)
- **Condition**: `IdleDetection.isUserIdle(15 * 60 * 1000)` (User away for 15 mins).
- **Action**: Sets `animation: "sleep"`, `emotion: "sleepy"`.

### The "Curious Hover" Behavior (Priority 20)
- **Condition**: `Character.interaction === "hover"`.
- **Action**: Sets `emotion: "curious"`. (Does not change animation, preserving base pose).

## 4. State Safety

A `Behavior` must never directly talk to the renderer or the DOM. A behavior's only output mechanism is calling setters on the `CompanionEngine` (`setAnimation`, `setEmotion`). The integration layer is responsible for translating that state into pixels.
