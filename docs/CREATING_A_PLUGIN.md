# Creating a Plugin for Mitra

This guide walks you through creating a simple plugin for the Mitra companion engine.

## 1. Implement the Plugin

Plugins must implement the `MitraPlugin` interface. This defines your plugin's metadata (manifest) and its lifecycle hooks.

Create a new file, for example, `src/plugin/examples/hello-world-plugin.ts`:

```typescript
import type { MitraPlugin, PluginAPI, PluginBehavior } from "@/plugin/types";

// 1. Define a custom behavior
// Notice how it uses the safe PluginBehaviorContext
const CustomWobbleBehavior: PluginBehavior = {
  definition: {
    id: "plugin:wobble",
    priority: 10,
    weight: 2,
    cooldownMs: 30000, 
    action: "walk", 
    canInterrupt: false,
  },
  canExecute(context) {
    // We only access state through getters
    const char = context.getCharacterState();
    return char.emotion === "happy";
  },
  execute(context) {
    // We request actions safely, rather than mutating state directly
    context.requestMovement({ type: "snap-to-edge" });
  }
};

// 2. Export the Plugin Definition
export const HelloWorldPlugin: MitraPlugin = {
  manifest: {
    id: "com.example.helloworld",
    name: "Hello World Plugin",
    author: "Your Name",
    description: "An example plugin.",
    version: "1.0.0",
    engineVersion: "^1.0.0",
    
    // IMPORTANT: You must declare permissions for what you intend to do!
    permissions: ["behaviors", "commands"],
  },

  async onInstall() {
    console.log("[Plugin] Installed!");
  },

  async onInitialize(api: PluginAPI) {
    console.log("[Plugin] Booting up...");

    // Register our behavior via the safe API facade
    api.registerBehavior(CustomWobbleBehavior);

    // Register a command
    api.registerCommand({
      id: "helloworld.sayhi",
      label: "Say Hello",
      execute: () => console.log("Hello from the plugin!"),
    });

    // Listen to engine events securely
    api.onEvent("preferences:updated", (prefs) => {
      console.log("[Plugin] User updated preferences:", prefs);
    });
  },

  async onEnable() {
    // Allocate resources (e.g. intervals, file watchers)
  },

  async onDisable() {
    // Clean up resources
  }
};
```

## 2. Load the Plugin in the Application

Currently, plugins are registered statically in `src/app/App.tsx`. In the future, this will be handled dynamically via a plugin marketplace or local disk loading.

Open `src/app/App.tsx` and import your plugin:

```typescript
import { createPluginManager } from "@/plugin";
import { HelloWorldPlugin } from "@/plugin/examples/hello-world-plugin";
```

Inside the `useEffect` that bootstraps the engine, load your plugin using the `PluginManager`:

```typescript
useEffect(() => {
    // ... setup storage, window controller, and brain ...

    const pluginManager = createPluginManager(brain, eventBus);
    
    // Load the plugin
    pluginManager.loadPlugin(HelloWorldPlugin).catch(console.error);

    // ...
}, []);
```

## 3. Verify it Works

Run the application:
```bash
bun run tauri dev
```

You will see the plugin's `console.log` statements in the developer tools confirming its lifecycle. Furthermore, the `Brain` will now occasionally select your `plugin:wobble` behavior probabilistically alongside the default behaviors!
