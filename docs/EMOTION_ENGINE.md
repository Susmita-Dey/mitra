# Emotion Engine

> Internal technical specification for `src/brain/emotion-engine.ts`.
> This document is for engineers extending Mitra's behavior system.

---

## Overview

The Emotion Engine manages Mitra's internal emotional state. It sits entirely within the Brain module and is invisible to the rendering layer. It produces one value — the current `Emotion` — which the Brain commits to the `CompanionEngine` at the end of each perception tick.

It is not a simple state setter. It enforces rules:

- Emotions have **priority** — high-priority states resist being replaced.
- Emotions have **decay** — most expire automatically after a fixed duration.
- Some emotions are **sticky** — they persist until explicitly cleared by a system-level reset.
- Emotions have **transition guards** — not every state can be entered from every other state.

---

## Lifecycle

```
Brain.think()
  │
  ├── emotionEngine.tick()        ← advance decay timers
  │
  ├── behavior.execute(context)
  │      └── context.pushEmotion(emotion)
  │              └── emotionEngine.push(emotion)  ← evaluated against rules
  │
  └── engine.setEmotion(emotionEngine.getCurrent())  ← commit to store
```

The Emotion Engine is ticked **before** behaviors execute. This ensures that a decayed emotion does not block an incoming push within the same tick.

---

## Emotional States

| State | Priority | Decay | Interruptible | Allowed From |
|---|---|---|---|---|
| `neutral` | 0 | none (sticky baseline) | ✅ | any |
| `relaxed` | 1 | 30 seconds | ✅ | any |
| `waiting` | 2 | 15 seconds | ✅ | any |
| `curious` | 3 | 8 seconds | ✅ | any |
| `happy` | 3 | 10 seconds | ✅ | any |
| `concerned` | 4 | 12 seconds | ✅ | any |
| `sleepy` | 5 | none (sticky) | ❌ | any |
| `focused` | 6 | none (sticky) | ❌ | `neutral`, `relaxed`, `waiting` |

### State descriptions

**`neutral`** — The baseline resting state. Always reachable from any state. Persists until replaced. `IdleBehavior` continuously attempts to push this as a fallback.

**`relaxed`** — A gentle positive state. Mitra is at ease. Entered when the session has been calm for a while. Decays after 30 seconds if nothing reinforces it.

**`waiting`** — Passive anticipation. Mitra has noticed something but is not yet reacting. Decays after 15 seconds.

**`curious`** — Triggered by an external stimulus (e.g., user hovering). Time-bounded — it fades after 8 seconds without reinforcement.

**`happy`** — A warm, positive response. Triggered by user interaction events. Decays after 10 seconds.

**`concerned`** — Empathetic attention directed at the user. Not a sad or anxious state — it is outward-facing. Decays after 12 seconds.

**`sleepy`** — Engaged when the user has been away for an extended period. Sticky — will not decay on its own. Must be explicitly cleared by calling `emotionEngine.clear()` or `context.setEmotion("neutral")` when the user returns.

**`focused`** — The highest-priority state. Engaged when Mitra detects deep user focus (long active session, high keyboard activity). Sticky and uninterruptible. Can only be entered from calm states (`neutral`, `relaxed`, `waiting`) to prevent jarring transitions from active emotions.

---

## The Push Contract

`push(emotion)` returns `true` if the push was accepted, `false` if rejected.

A push is **rejected** if either:

1. **Transition guard fails**: The new emotion's `allowedFrom` list does not include the current active state.
2. **Interruptibility check fails**: The current emotion is not interruptible AND the incoming emotion's priority is not strictly higher than the current one's.

```
push("focused") when active = "happy"
  → incoming.allowedFrom = ["neutral", "relaxed", "waiting"]
  → "happy" is NOT in allowedFrom
  → REJECTED ✗

push("focused") when active = "neutral"
  → incoming.allowedFrom includes "neutral"  ✓
  → current is interruptible  ✓
  → ACCEPTED ✓

push("happy") when active = "sleepy"
  → incoming.allowedFrom = "any"  ✓
  → current (sleepy) is NOT interruptible
  → incoming.priority (3) is NOT > current.priority (5)
  → REJECTED ✗

push("curious") when active = "sleepy"
  → incoming.allowedFrom = "any"  ✓
  → current (sleepy) is NOT interruptible
  → incoming.priority (3) is NOT > current.priority (5)
  → REJECTED ✗
```

---

## How Behaviors Should Use It

Behaviors receive the `BehaviorContext`. Use `pushEmotion` for all normal emotional transitions.

```typescript
// Good — goes through EmotionEngine rules
execute: (context) => {
  context.pushEmotion("curious");
}

// Only for critical system resets (e.g., SleepyWakeUpBehavior)
execute: (context) => {
  context.setEmotion("neutral");   // bypasses all rules
}
```

Do not check the return value of `pushEmotion` unless your behavior logic genuinely needs to respond to a rejection. Silent failures are correct behavior — Mitra simply stays in its current state.

---

## Extending with New Emotions

1. Add the new value to `Emotion` in `src/types/emotion.ts`.
2. Add a definition to `EMOTION_DEFINITIONS` in `src/brain/emotion-definitions.ts`.
3. Add the CSS class and Rive input mapping to `assets/characters/mitra/character.json`.
4. Implement the expression in the Rive state machine per `docs/ANIMATION_SPEC.md`.
5. Update this document.

No changes to the `EmotionEngine` implementation itself are required — it reads the definitions at runtime.

---

## Files

| File | Role |
|---|---|
| `src/types/emotion.ts` | The `Emotion` union type |
| `src/brain/emotion-definitions.ts` | Static config table (priority, decay, rules) |
| `src/brain/emotion-engine.ts` | Runtime engine (push, tick, clear, getCurrent) |
| `src/brain/brain.ts` | Owns and ticks the engine; commits resolved emotion |
| `src/behavior/behavior.ts` | `BehaviorContext.pushEmotion` contract |
| `assets/characters/mitra/character.json` | Maps emotions to Rive inputs and CSS classes |
