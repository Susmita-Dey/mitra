# Scheduler Service

> Internal technical specification for `src/system/scheduler-service.ts`.

---

## Overview

The Scheduler Service is a centralized timer system that allows Mitra's Brain and behaviors to schedule future actions without directly calling `setTimeout` or `setInterval`.

Using scattered timeouts is an anti-pattern in companion engines because it makes state unpredictable and hard to test. The Scheduler centralizes all timing into a single priority queue, ensuring predictable execution order.

## Features

- **Centralized Timer**: Uses a single underlying `setTimeout` that sleeps until the exact moment the next task is due, preventing unnecessary CPU wakeups.
- **Priority Execution**: If multiple tasks fall due at the exact same time, they are sorted and executed by priority (highest first).
- **Random Intervals**: Supports `[minMs, maxMs]` ranges natively, resolving a fresh random duration on every loop.
- **Clean Cancellation**: Returns a `TaskHandle` with a `cancel()` method, or you can provide your own deterministic `id`.

---

## API

### Types

```typescript
type TimeRange = number | [number, number];

interface ScheduleOptions {
  delayMs?: TimeRange;
  intervalMs?: TimeRange;
  priority?: number;
  id?: string;
}
```

### Usage

**1. One-off delayed task:**
```typescript
scheduler.schedule(() => {
  console.log("3 seconds passed");
}, { delayMs: 3000 });
```

**2. Random recurring task:**
```typescript
// Triggers randomly between every 10 to 30 seconds
const handle = scheduler.schedule(() => {
  console.log("Random event!");
}, { intervalMs: [10000, 30000] });

// Later...
handle.cancel();
```

**3. Priority execution:**
```typescript
// Both tasks are due at the exact same moment
scheduler.schedule(() => console.log("Low priority"), { delayMs: 1000, priority: 0 });
scheduler.schedule(() => console.log("High priority"), { delayMs: 1000, priority: 50 });

// Output:
// "High priority"
// "Low priority"
```

---

## Brain Perception Cycle

The primary driver of the engine — the `Brain`'s perception cycle — is powered by this scheduler. 

In `src/brain/brain.ts`, the `initializeBrain` function schedules the `tick()` function on a `1000ms` interval with priority `100` (very high). 

Because it uses the Scheduler instead of `setInterval`, any future behavior that schedules an action at the exact same millisecond will correctly yield to the perception tick if its priority is lower.

---

## Files

| File | Role |
|---|---|
| `src/system/scheduler.ts` | Types and interfaces |
| `src/system/scheduler-service.ts` | The priority-queue based centralized timer |
| `src/system/index.ts` | Exports |
| `src/brain/brain.ts` | Subscribes the main perception cycle to the scheduler |
| `src/app/App.tsx` | Owns the lifecycle (creates and disposes the service) |
