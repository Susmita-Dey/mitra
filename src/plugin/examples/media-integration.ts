import type { MitraPlugin, PluginAPI } from "../types";

export const MediaSessionPlugin: MitraPlugin = {
  manifest: {
    id: "mitra.official.media",
    name: "Media Integration",
    version: "1.0.0",
    author: "Mitra+",
    description: "Detects media playback from local system or Spotify and emits semantic media events.",
    engineVersion: "1.0.0",
    permissions: ["events", "integrations"],
    license: "MIT"
  },

  async onInit(_api: PluginAPI) {
    // Stub for connecting to Windows Media Session or an OAuth Spotify Poller
  },

  async onEnable(api: PluginAPI) {
    // Instead of forcing a "dance" animation, it emits a semantic event.
    // The Brain will decide if Mitra should sway, bob, listen, or dance based on mood/context.
    api.events.emit({
      type: "MediaStarted",
      source: "spotify",
      title: "Lofi Beats",
      artist: "Chillhop",
      energyLevel: "low" // Hints to the Brain to use a GentleSway instead of EnergeticDance
    });
  },

  async onDisable(api: PluginAPI) {
    api.events.emit({
      type: "MediaPaused"
    });
  }
};
