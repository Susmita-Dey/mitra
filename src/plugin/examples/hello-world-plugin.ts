import type { MitraPlugin, PluginAPI, PluginBehavior } from "@/plugin/types";

/**
 * A custom behavior injected by the plugin.
 * Notice how it only uses safe PluginBehaviorContext methods.
 */
const CustomWobbleBehavior: PluginBehavior = {
  definition: {
    id: "plugin:wobble",
    priority: 10,
    weight: 2,
    cooldownMs: 30000, // Once every 30 seconds max
    action: "walk", // Pretend we want to trigger the walk animation
    canInterrupt: false,
  },
  canExecute(context) {
    // Only execute if Mitra is happy
    const char = context.getCharacterState();
    return char.emotion === "happy";
  },
  execute(context) {
    // Request a movement safely
    context.requestMovement({ type: "snap-to-edge" });
  }
};

/**
 * Example "Hello World" Plugin.
 */
export const HelloWorldPlugin: MitraPlugin = {
  manifest: {
    id: "com.example.helloworld",
    name: "Hello World Plugin",
    author: "Jane Doe",
    description: "An example plugin that adds a custom wobble behavior.",
    version: "1.0.0",
    engineVersion: "^1.0.0",
    // We strictly declare we need behaviors permission!
    permissions: ["behaviors", "commands"],
  },

  async onInstall() {
    console.log("[HelloWorldPlugin] Installed!");
  },

  async onInitialize(api: PluginAPI) {
    console.log("[HelloWorldPlugin] Initializing...");

    // Register our custom behavior
    api.registerBehavior(CustomWobbleBehavior);

    // Register a command (e.g. for a future command palette)
    api.registerCommand({
      id: "helloworld.sayhi",
      label: "Say Hello",
      execute: () => console.log("Hello from the plugin command!"),
    });

    // Listen to engine events
    api.onEvent("preferences:updated", (prefs) => {
      console.log("[HelloWorldPlugin] Noticed preferences changed:", prefs);
    });
  },

  async onEnable() {
    console.log("[HelloWorldPlugin] Enabled!");
  },

  async onDisable() {
    console.log("[HelloWorldPlugin] Disabled!");
  },

  async onDestroy() {
    console.log("[HelloWorldPlugin] Destroyed!");
  }
};
