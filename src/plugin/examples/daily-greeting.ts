import type { MitraPlugin, PluginAPI } from "../types";

export const DailyGreetingPlugin: MitraPlugin = {
  manifest: {
    id: "mitra.example.daily-greeting",
    name: "Daily Greeting",
    version: "1.0.0",
    author: "Mitra Core Team",
    description: "Uses the SDK scheduler to wish the user good morning once a day.",
    engineVersion: "1.0.0",
    permissions: ["reminders", "events"],
    license: "MIT"
  },

  async onInit(api: PluginAPI) {
    // We do NOT use setInterval. We use the SDK-backed scheduler.
    api.scheduler.schedule(() => {
      api.events.emit({
        type: "RequestGreeting",
        context: "morning"
      });
    }, { intervalMs: 86400000 });
  }
};
