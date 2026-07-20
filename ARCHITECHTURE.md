# Mitra Architecture

Mitra is built around living systems instead of application layers. It is designed to be **character-agnostic**. The core engine does not know if it is rendering a Panda, a Fox, or a Capybara.

## 1. Companion Engine (The State)

The `CompanionEngine` is a lightweight pub/sub store. It is the single source of truth for the character's state, divided into four independent axes:
- `Position`
- `Animation` (Base pose: idle, walk, sleep)
- `Emotion` (Facial expression: neutral, happy, sleepy)
- `Interaction` (User input: hover, click)

## 2. Brain (The Decider)

The Brain runs a continuous perception cycle (ticking every 1000ms):
1. **`observe()`**: Gathers data from the `System` layer (Idle time, Battery, OS Window).
2. **`think()`**: Evaluates the list of registered `Behavior` objects. It sorts them by priority and finds the first one that `canExecute()`.
3. **`act()`**: Executes the chosen behavior.

The Brain **never** directly manipulates the UI or rendering.

## 3. Behavior (The Mutator)

A `Behavior` connects the Brain and the Engine. 
- It defines a `priority` (0 for ambient idle, 100+ for critical system events).
- It provides an `execute(context)` function.
- It mutates the Engine state via the `BehaviorContext` (e.g., calling `context.setEmotion("sleepy")`).

## 4. Body & Renderer (The View)

The Body is a dumb integration layer. It receives the immutable state snapshot from the Engine and delegates rendering to a backend based on `character.json`.
- It reads `data-animation` and `data-emotion` to drive the visuals.
- The renderers (`RiveRenderer`, `SVGRenderer`, `PlaceholderRenderer`) translate the Engine state into actual pixels.
- The Renderer never makes decisions. It only reflects state.

## 5. System (The OS Boundary)

Communicates with the operating system via pure interfaces (backed by Tauri/Rust).
- Idle detection
- Battery status
- Clock/Time
- Window management

## 6. Storage (The Memory)

Stores user preferences and reminder history locally.
- Abstracted behind `Storage` interface (e.g., `MemoryStorage` during dev, SQLite/FS in prod).
- No cloud. No accounts. No tracking.