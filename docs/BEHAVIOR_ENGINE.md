# Behavior Engine

> Internal technical specification for `src/behavior/behavior-engine.ts`.
> For engineers implementing or extending Mitra's behavior system.

---

## Overview

The Behavior Engine is responsible for deciding **what Mitra does next** on each Brain tick. It replaces the original `behaviors.find()` mechanism with a system that supports:

- **Priority brackets** — higher-priority behaviors always pre-empt lower ones.
- **Probabilistic selection** — within a bracket, behaviors compete by weighted random draw.
- **Cooldowns** — each behavior has a minimum rest time before it can run again.
- **Anti-repetition** — a recency history penalises recently-used behaviors, preventing loops.
- **Interruption rules** — defined per behavior via `canInterrupt: boolean`.
- **Generic actions** — behaviors map to abstract `Animation` actions, not hardcoded names. The Renderer maps actions to asset-specific animations via `character.json`.

---

## Architecture

```
Brain.think()
  │
  ├── behaviorEngine.select(context)
  │     │
  │     ├── 1. Filter: canExecute() + not on cooldown
  │     ├── 2. Group by priority bracket
  │     ├── 3. Isolate top bracket
  │     ├── 4. Apply recency penalty to weights
  │     └── 5. Weighted random selection
  │
  ├── selected.execute(context)        ← behavior runs
  └── behaviorEngine.markExecuted(id) ← cooldown + history updated
```

---

## Registered Behaviors

| ID | Priority | Weight | Cooldown | Action | Interruptible |
|---|---|---|---|---|---|
| `ambient.idle` | 0 | 5 | 0ms | `idle` | No |
| `ambient.blink` | 0 | 8 | 3s | `blink` | No |
| `ambient.look-around` | 0 | 3 | 20s | `look-around` | No |
| `ambient.stretch` | 0 | 2 | 60s | `stretch` | No |
| `ambient.walk` | 0 | 2 | 45s | `walk` | No |
| `ambient.sleep` | 5 | 10 | 30s | `sleep` | Yes |
| `reactive.observe` | 20 | 10 | 5s | `observe` | Yes |

### Priority brackets

- **0 (Ambient)**: Autonomous idle behaviors. Compete probabilistically among themselves.
- **5 (Elevated Ambient)**: Sleepy state — pre-empts ambient behaviors when triggered by the EmotionEngine.
- **20 (Reactive)**: User presence behaviors. Always win when eligible. Phase 3 adds Reminder behaviors here (priority 50+).

---

## Selection Algorithm

```
1. Collect all behaviors where canExecute(context) === true AND not on cooldown.
2. Find maxPriority = max(eligible.map(b => b.priority)).
3. topBracket = eligible.filter(b => b.priority === maxPriority).
4. For each in topBracket:
     effectiveWeight = definition.weight × (RECENCY_PENALTY ^ recentOccurrences)
5. Weighted random pick from topBracket using effectiveWeight.
6. If all weights penalised to 0: uniform random from topBracket (deadlock break).
```

**Recency penalty constants:**
- `HISTORY_SIZE = 5` — how many past ticks to remember.
- `RECENCY_PENALTY = 0.5` — each recent occurrence halves the weight.

**Example:** Blink (weight 8) ran twice in the last 5 ticks. Effective weight = `8 × 0.5 × 0.5 = 2`. It is now only 2× more likely than Idle (weight 5) instead of 8×.

---

## Cooldowns

Cooldowns are tracked per behavior ID using a `Map<id, lastExecutedTimestamp>`.

A behavior is on cooldown if:
```
Date.now() - lastExecuted < definition.cooldownMs
```

Cooldown starts at the moment `markExecuted(id)` is called (after `execute()`).

---

## Adding a New Behavior

1. Create `src/behavior/behaviors/my-behavior.ts`.
2. Define a `BehaviorDefinition` (priority, weight, cooldown, action).
3. Export a `RegisteredBehavior` with `canExecute` and `execute`.
4. Export it from `src/behavior/behaviors/index.ts`.
5. Register it in `src/app/App.tsx` via `brain.registerBehavior(MyBehavior)`.
6. Add the action to `src/types/animation.ts` if it is new.
7. Add the action mapping to `assets/characters/mitra/character.json`.

---

## Files

| File | Role |
|---|---|
| `src/behavior/behavior-definition.ts` | `BehaviorDefinition` type (static config) |
| `src/behavior/behavior-engine.ts` | Runtime engine (select, cooldown, history) |
| `src/behavior/behaviors/idle.ts` | Priority 0, always-eligible fallback |
| `src/behavior/behaviors/blink.ts` | Priority 0, high weight, short cooldown |
| `src/behavior/behaviors/look-around.ts` | Priority 0, medium weight, 20s cooldown |
| `src/behavior/behaviors/stretch.ts` | Priority 0, low weight, 60s cooldown |
| `src/behavior/behaviors/sleep.ts` | Priority 5, emotion-gated by sleepy state |
| `src/behavior/behaviors/walk.ts` | Priority 0, low weight, 45s cooldown |
| `src/behavior/behaviors/observe.ts` | Priority 20, hover-interaction triggered |
