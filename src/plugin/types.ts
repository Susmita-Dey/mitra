// Unused imports removed
import type { EventName, EventHandler, Unsubscribe, SystemEvents } from "@/system/event-bus";
import type { BehaviorDefinition } from "@/behavior/behavior-definition";

/**
 * Valid permissions a plugin can request.
 * The PluginManager will deny API calls if the plugin lacks the required permission.
 */
export type PluginPermission =
  | "behaviors"
  | "reminders"
  | "widgets"
  | "commands"
  | "filesystem"
  | "notifications";

/**
 * Metadata declaring a plugin's identity and requirements.
 */
export interface PluginManifest {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  engineVersion: string;
  permissions: PluginPermission[];
  homepage?: string;
  license?: string;
}

/**
 * The core Plugin interface with strict lifecycle hooks.
 * Designed for future runtime/dynamic loading.
 */
export interface MitraPlugin {
  manifest: PluginManifest;

  /** Called once when the plugin is first installed (or upgraded) into the system. */
  onInstall?(): Promise<void>;
  
  /** Called to bootstrap the plugin (e.g., when the engine starts). Here the plugin receives its API facade. */
  onInitialize(api: PluginAPI): Promise<void>;
  
  /** Called when the user actively enables the plugin. */
  onEnable?(): Promise<void>;
  
  /** Called when the user disables the plugin. It should clean up active resources. */
  onDisable?(): Promise<void>;
  
  /** Called before the plugin is completely removed or the app terminates. */
  onDestroy?(): Promise<void>;
}

// ── Facades ─────────────────────────────────────────────────────────────

/**
 * Safe context passed to plugin-registered behaviors.
 * Exposes NO internal engine stores or dependencies.
 */
export interface PluginBehaviorContext {
  /** Get a read-only snapshot of the world state. */
  getWorldState(): Readonly<import("@/types").WorldState>;
  /** Emit an intent to the system. */
  emit(intent: import("@/types").Intent): void;
  // scheduleTask(task: any): void; // Stub for future async task scheduling
}

/**
 * A behavior definition provided by a plugin.
 * Mirrors the internal RegisteredBehavior but uses PluginBehaviorContext.
 */
export interface PluginBehavior {
  definition: BehaviorDefinition;
  canExecute(context: PluginBehaviorContext): boolean;
  execute(context: PluginBehaviorContext): void;
}

export interface CommandDefinition {
  id: string;
  label: string;
  execute: () => void;
}

export interface WidgetDefinition {
  id: string;
  // For React neutrality at the engine level, widgets could return plain data or a known renderable type.
  // Using any for now to allow React nodes until a strict UI bridge is built.
  render: () => any;
}

export interface ReminderDefinition {
  id: string;
  schedule: string; // e.g., cron or "every 5m"
  action: () => void;
}

/**
 * The secure sandbox facade provided to plugins during `onInitialize`.
 * Method calls will throw if the plugin lacks the required permission.
 */
export interface PluginAPI {
  /** Subscribe to engine events. Safe default capability. */
  onEvent<K extends EventName>(event: K, handler: EventHandler<SystemEvents[K]>): Unsubscribe;
  
  /** Requires "behaviors" permission. */
  registerBehavior(behavior: PluginBehavior): void;
  
  /** Requires "commands" permission. */
  registerCommand(command: CommandDefinition): void;
  
  /** Requires "widgets" permission. */
  registerWidget(widget: WidgetDefinition): void;
  
  /** Requires "reminders" permission. */
  registerReminder(reminder: ReminderDefinition): void;
}
