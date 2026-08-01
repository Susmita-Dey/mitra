# Contributing a Plugin to Mitra

> **Required reading before submitting a plugin PR.**

## Architecture Overview

Mitra uses a **compiled, sandboxed plugin system** (v1.1). Plugins are plain TypeScript files compiled directly into the Mitra bundle — no dynamic `eval()`, `Function()`, or script injection is permitted.

```
Your Plugin (TypeScript)
      ↓  compiles with project
   Plugin Manager (loads & sandboxes)
      ↓  wraps with PluginAPI
   Brain (evaluates Intents emitted by plugin)
      ↓  dispatches
   Executors (renders, moves, plays sound)
```

### Core Rule: Plugins Emit Intents, Never Render

A plugin must **never**:
- Touch the DOM directly
- Call `document.querySelector`, `innerHTML`, or similar
- Manipulate Mitra's state directly (animation, emotion, position)

A plugin **must** use the `PluginAPI` to emit semantic **Intents** or register **Behaviors**. The Brain decides how to respond.

---

## Plugin Manifest

Every plugin must export a `manifest` object:

```ts
import type { MitraPlugin } from "@/plugin/types";

export const MyPlugin: MitraPlugin = {
  manifest: {
    id: "com.yourname.myplugin",     // reverse domain, unique
    name: "My Plugin",
    version: "1.0.0",
    description: "What it does.",
    engineVersion: "1.0.0",
    permissions: ["events"],         // only request what you need
    license: "MIT",
  },

  async onInit(api) {
    // Subscribe to system events
    api.events.on("media:started", ({ title }) => {
      api.events.emit({ type: "SetBubble", text: `🎵 Now playing: ${title}` });
    });
  },
};
```

---

## Lifecycle Hooks

| Hook | When it runs | API available? |
|------|-------------|----------------|
| `onInstall(api)` | First time plugin is loaded ever | ✅ |
| `onInit(api)` | Every startup, after install | ✅ |
| `onEnable(api)` | When user enables plugin | ✅ |
| `onDisable(api)` | When user disables plugin | ✅ |
| `onUpdate(api)` | After a version bump | ✅ |
| `onDestroy(api)` | On full uninstall | ✅ |

---

## Available Intents

Plugins emit **semantic Intents** via `api.events.emit(intent)`:

### Character
| Intent | Effect |
|--------|--------|
| `{ type: "Greet" }` | Wave + happy |
| `{ type: "Celebrate" }` | Celebrate animation |
| `{ type: "SetBubble", text, duration? }` | Speech bubble |
| `{ type: "RequestGreeting", context }` | Context-aware greeting |
| `{ type: "ShowSpeechBubble", text, duration? }` | Show a speech bubble |
| `{ type: "ChangeEmotion", emotion }` | Change Mitra's emotion |

### Media
| Intent | Effect |
|--------|--------|
| `{ type: "MediaStarted", source, title, artist, energyLevel }` | Triggers mood-aware reaction |
| `{ type: "MediaPaused" }` | Calm down |

### Work
| Intent | Effect |
|--------|--------|
| `{ type: "GitCommitDetected", repo, message }` | Triggers a celebration |
| `{ type: "LogEvent", message }` | Internal log (debug) |

---

## Available Permissions

```ts
type PluginPermission =
  | "events"      // subscribe to system events
  | "behaviors"   // register custom behaviors in the brain
  | "commands"    // register slash-commands
  | "widgets"     // register overlay widgets
  | "reminders"   // register reminders
  | "integrations"; // connect to external services
```

Only request permissions your plugin actually uses. Requesting excessive permissions will cause your PR to be rejected.

---

## Scheduler (Timers)

**Never** use `setTimeout` or `setInterval` directly. Use the scheduler:

```ts
async onInit(api) {
  // Fire once after 5 seconds
  api.scheduler.schedule(() => {
    api.events.emit({ type: "Greet" });
  }, { delayMs: 5000 });

  // Fire every hour with ±5 minute jitter
  api.scheduler.schedule(() => {
    api.events.emit({ type: "SetBubble", text: "Still here! 🦊" });
  }, { intervalMs: [55 * 60_000, 65 * 60_000] });
}
```

---

## Submitting a Plugin

1. Place your plugin in `src/plugin/examples/` (for built-in examples) or document it as an external plugin.
2. Open a Pull Request. Our GitHub Actions CI will automatically:
   - ✅ Compile the project (`tsc && vite build`)
   - ✅ Scan for forbidden APIs (`eval`, `innerHTML`, `document.`, `Function(`)
   - ✅ Verify no new npm packages are added without approval
   - ✅ Run a bundle size check (must stay under 500kb gzip)

3. A maintainer will review the PR for:
   - Semantic correctness (does it emit the right intents?)
   - Appropriate permission scope
   - Code quality and documentation

---

## Security Checklist

Before submitting, ensure your plugin:

- [ ] Does NOT use `eval()`, `new Function()`, or `document.write()`
- [ ] Does NOT access `window.__mitra` or internal engine state
- [ ] Does NOT create raw `<script>` tags or load external scripts
- [ ] Does NOT make network requests without the `integrations` permission
- [ ] Does NOT use `setInterval` or `setTimeout` (use `api.scheduler`)
- [ ] Correctly declares all permissions it uses in the manifest

Violation of any of these rules will result in PR rejection and potential ban from the plugin ecosystem.
