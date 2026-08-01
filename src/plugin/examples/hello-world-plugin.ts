import type { MitraPlugin, PluginAPI } from "../types";

export const HelloWorldPlugin: MitraPlugin = {
  manifest: {
    id: "mitra.example.helloworld",
    name: "Hello World",
    version: "1.0.0",
    author: "Mitra Core Team",
    description: "A minimal example plugin demonstrating intents and lifecycle.",
    engineVersion: "1.0.0",
    permissions: ["events"],
    license: "MIT"
  },

  async onInit(api: PluginAPI) {
    // This runs when the engine boots
    api.events.emit({
      type: "LogEvent",
      message: "Hello World Plugin initialized!"
    });
  },

  async onEnable(api: PluginAPI) {
    // Runs when user toggles plugin ON
    api.events.emit({
      type: "ShowSpeechBubble",
      text: "Hello from the Plugin SDK! \ud83d\udc4b",
      duration: 3000
    });
  }
};
