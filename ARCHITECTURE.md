# Mitra Architecture & Overview

## What is Mitra?
Mitra (Sanskrit for "friend" or "companion") is a delightful, context-aware digital companion designed to live on your desktop. Unlike intrusive productivity tools that rely on annoying popups, Mitra aims to promote well-being through ambient presence, adorable micro-interactions, and smart, context-sensitive routines.

## Features
- **Ambient Presence:** Mitra wanders your screen, sleeps during quiet hours, and breathes life into your desktop via a lightweight, procedurally-animated SVG rig.
- **Context Awareness:** By securely polling your OS natively via Rust/Tauri, Mitra knows if you are coding (equips a laptop), if it's raining outside (equips an umbrella), or if you're in a meeting (hides herself or snoozes reminders).
- **Intelligent Reminders:** A resilient, mathematically-sound scheduling engine handles clock-based (meals) and interval-based (water, stretch, eyes, bio) routines. If your PC is asleep when a meal occurs, she gracefully "catches up" so you don't miss important breaks.
- **Organic Interactions:** You can pet her head or tickle her belly. The interaction engine seamlessly processes these clicks, emits Foley audio (chirps/purrs), and updates her internal personality and emotion state.

---

## Technical Architecture

Mitra is built with a **Tauri** (Rust) backend and a **React/TypeScript** frontend. The application logic strictly separates *Decision Making* (Brain) from *Rendering* (Body).

### 1. The Brain (`src/brain/`)
The Brain operates on a 1-second `tick()` loop (`brain.ts`) and manages the internal state machine.
- **Memory Engine:** Stores persistent state (reminders, personality, timeline events, last interaction time).
- **Context Engine:** Receives environment data (battery, weather, active apps) from the Tauri backend via an event bus.
- **Reminder Engine:** Evaluates the current time against configured intervals and clock schedules. Emits intents if a reminder needs to trigger.
- **Behavior Engine:** Evaluates a weighted list of possible behaviors (e.g., `IdleBehavior`, `SnackReminderBehavior`, `WanderBehavior`) and selects the highest-priority action.

### 2. The Body & Rig (`src/body/`)
The Body has no decision-making capabilities. It simply receives a `ProceduralAnimationState` (e.g., `{ posture: "sit", arms: "up", props: ["laptop"] }`) and renders it.
- **`useAnimationRig.ts`:** Translates high-level postures into specific skeletal joint angles (e.g., `leftArmRot: 15`). It uses a `requestAnimationFrame` loop with spring physics (tension, friction, mass) to smoothly interpolate bones frame-by-frame, completely bypassing heavy React DOM repaints.
- **`MockRenderer.tsx`:** An optimized SVG renderer that binds the interpolated skeletal values to SVG groups (`<g>`). It conditionally renders procedural props like umbrellas, towels, sunglasses, and laptops on the correct Z-layers.

### 3. The Event & State Lifecycle
To prevent race conditions (like a reminder instantly re-triggering upon dismissal), Mitra uses a unidirectional data flow:
1. **Observe:** The Brain reads external context and internal memory.
2. **Think:** The Behavior Engine scores available actions and generates *Intents* (e.g., `PlayAnimation("sit")`).
3. **Act:** Intents are flushed to the respective systems (audio, renderer, window controller).
4. **Interact:** If the user clicks a speech bubble, an event (`companion:reminder:ack`) is dispatched. The Brain intercepts this, marks the reminder as `acknowledged`, explicitly queues the *next* occurrence in the future, and immediately forces a new `tick()` to visually clear the bubble.

## Plugins
Mitra includes a nascent `PluginManager` (`src/plugin/`) capable of loading third-party extensions. In the future, this will allow users to install custom behaviors, props, or integrations (e.g., a Pomodoro timer plugin) while maintaining sandboxing and API stability.
