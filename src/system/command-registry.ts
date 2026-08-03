import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { parseReminderString, checkSafety, checkBuiltInClash } from "./reminder-parser";

export interface CommandContext {
  brain: any;
  appStorage: any;
  winCtrl?: any;
  audioSystem?: any;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  feedbackEmotion?: string;
  feedbackText?: string;
  data?: any; // To pass created reminders or values
}

export interface CommandAction {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  description: string;
  execute(input: string, context: CommandContext): Promise<CommandResult>;
  preview?(input: string): { label: string; details?: string } | null;
}

class Registry {
  private actions: CommandAction[] = [];

  register(action: CommandAction) {
    this.actions.push(action);
  }

  getActions(): CommandAction[] {
    return this.actions;
  }

  findAction(input: string): { action: CommandAction; cleanInput: string } | null {
    const text = input.trim().toLowerCase();
    if (!text) return null;

    // Check direct / command match first
    if (text.startsWith("/")) {
      const parts = text.split(/\s+/);
      const cmdName = parts[0].substring(1);
      const action = this.actions.find(
        (a) => a.id === cmdName || a.keywords.includes(cmdName)
      );
      if (action) {
        const cleanInput = input.substring(parts[0].length).trim();
        return { action, cleanInput };
      }
    }

    // Check fuzzy match on prefixes (e.g. typing "mute" without "/")
    for (const action of this.actions) {
      if (action.id === "remind") continue; // Skip default fallback for prefix checks
      for (const kw of action.keywords) {
        if (text.startsWith(kw)) {
          // Verify word boundary
          const nextChar = text.charAt(kw.length);
          if (nextChar === "" || nextChar === " ") {
            const cleanInput = input.substring(kw.length).trim();
            return { action, cleanInput };
          }
        }
      }
    }

    // Default fallback to remind provider
    const remindAction = this.actions.find((a) => a.id === "remind");
    if (remindAction) {
      return { action: remindAction, cleanInput: input.trim() };
    }

    return null;
  }
}

export const commandRegistry = new Registry();

// Register Settings / Open Settings Command
commandRegistry.register({
  id: "settings",
  name: "Open Settings",
  icon: "⚙️",
  keywords: ["settings", "options", "config", "preferences"],
  description: "Configure Mitra reminders and behaviors.",
  async execute(_input, _context) {
    try {
      const win = await WebviewWindow.getByLabel("settings");
      if (win) {
        await win.show();
        await win.setFocus();
        return { success: true, message: "Opening settings...", feedbackEmotion: "happy" };
      }
    } catch (err) {
      console.error(err);
    }
    return { success: false, message: "Could not open settings window." };
  },
  preview() {
    return { label: "Open Settings Window ⚙️" };
  }
});

// Register Mute Command
commandRegistry.register({
  id: "mute",
  name: "Mute Sounds",
  icon: "🔇",
  keywords: ["mute", "silent", "quiet"],
  description: "Mute all companion sounds.",
  async execute(_, context) {
    try {
      const current = await context.appStorage.load();
      await context.appStorage.update({ audio: { ...current.audio, muteSounds: true } });
      return { 
        success: true, 
        message: "Muted all sounds 🔇", 
        feedbackEmotion: "happy", 
        feedbackText: "I'll be quiet now! 🤫" 
      };
    } catch (err) {
      return { success: false, message: "Failed to mute sounds." };
    }
  },
  preview() {
    return { label: "Mute all companion sounds 🔇" };
  }
});

// Register Unmute Command
commandRegistry.register({
  id: "unmute",
  name: "Unmute Sounds",
  icon: "🔊",
  keywords: ["unmute", "sound", "volume-on"],
  description: "Unmute companion sounds.",
  async execute(_, context) {
    try {
      const current = await context.appStorage.load();
      await context.appStorage.update({ audio: { ...current.audio, muteSounds: false } });
      return { 
        success: true, 
        message: "Unmuted all sounds 🔊", 
        feedbackEmotion: "happy", 
        feedbackText: "Sounds on! Let's vibe! 🎵" 
      };
    } catch (err) {
      return { success: false, message: "Failed to unmute sounds." };
    }
  },
  preview() {
    return { label: "Unmute all companion sounds 🔊" };
  }
});

// Register Hide Command
commandRegistry.register({
  id: "hide",
  name: "Hide Mitra",
  icon: "🙈",
  keywords: ["hide", "close", "minimize", "dismiss"],
  description: "Send Mitra to the system tray.",
  async execute(_, context) {
    if (context.winCtrl) {
      await context.winCtrl.hide();
      return { success: true, message: "Mitra hidden." };
    }
    return { success: false, message: "Could not minimize Mitra." };
  },
  preview() {
    return { label: "Hide Mitra to system tray 🙈" };
  }
});

// Register Click-Through Toggle Command
commandRegistry.register({
  id: "clickthrough",
  name: "Toggle Click-Through",
  icon: "👻",
  keywords: ["clickthrough", "ghost", "lock"],
  description: "Toggle ignoring mouse clicks when idle.",
  async execute(_, context) {
    try {
      const current = await context.appStorage.load();
      const nextVal = !current.behavior.clickThrough;
      await context.appStorage.update({ behavior: { ...current.behavior, clickThrough: nextVal } });
      return { 
        success: true, 
        message: `Click-through ${nextVal ? "enabled" : "disabled"} 👻`, 
        feedbackEmotion: "happy", 
        feedbackText: nextVal ? "Click right through me! 👻" : "Catch me with your mouse! 🐾"
      };
    } catch (err) {
      return { success: false, message: "Failed to toggle click-through." };
    }
  },
  preview(_input) {
    return { label: "Toggle click-through mode 👻" };
  }
});

// Register Reminder Fallback Command
commandRegistry.register({
  id: "remind",
  name: "Add Reminder",
  icon: "⏰",
  keywords: ["remind", "reminder", "alarm", "schedule"],
  description: "Schedule a reminder (e.g. 'medicine in 30m')",
  async execute(input, _context) {
    const safety = checkSafety(input);
    if (!safety.safe) {
      return { 
        success: false, 
        message: safety.suggestion || "Please enter a safe reminder.", 
        data: { safety } 
      };
    }

    const clash = checkBuiltInClash(input);
    if (clash.clashed) {
      return {
        success: false,
        message: clash.reason
      };
    }

    const parsed = parseReminderString(input);
    if (!parsed) {
      return { success: false, message: "Could not parse reminder. Try: 'meds in 20m' or 'meeting at 2:30pm'." };
    }

    return {
      success: true,
      message: "Parsed successfully.",
      data: { parsed }
    };
  },
  preview(input) {
    if (!input.trim()) return null;

    const safety = checkSafety(input);
    if (!safety.safe) {
      return { label: "⚠️ Safety Warning", details: safety.suggestion };
    }

    const clash = checkBuiltInClash(input);
    if (clash.clashed) {
      return { label: "⚠️ Built-in Reminder Clash", details: clash.reason };
    }

    const result = parseReminderString(input);
    if (result) {
      let desc = "";
      if (result.triggerType === "countdown" && result.countdownMs) {
        desc = `in ${Math.round(result.countdownMs / 60000)}m`;
        if (result.countdownMs < 60000) {
          desc = `in ${Math.round(result.countdownMs / 1000)}s`;
        }
      } else if (result.triggerType === "interval" && result.intervalMs) {
        desc = `every ${Math.round(result.intervalMs / 60000)}m`;
        if (result.intervalMs < 60000) {
          desc = `every ${Math.round(result.intervalMs / 1000)}s`;
        }
      } else if (result.triggerType === "time" && result.time) {
        desc = `at ${result.time}`;
      }
      return { label: `Will remind you to: "${result.label}"`, details: desc };
    }

    return null;
  }
});
