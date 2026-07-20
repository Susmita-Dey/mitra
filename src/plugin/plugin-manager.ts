import type { Brain } from "@/brain";
import type { BehaviorContext } from "@/behavior";
import type { RegisteredBehavior } from "@/behavior/behavior-engine";
import type { EventBus } from "@/system/event-bus";
import type { 
  MitraPlugin, 
  PluginAPI, 
  CommandDefinition, 
  WidgetDefinition, 
  ReminderDefinition,
  PluginPermission,
  PluginBehavior,
  PluginBehaviorContext
} from "./types";

export interface PluginManager {
  /** Installs and initializes a plugin. */
  loadPlugin(plugin: MitraPlugin): Promise<void>;
  /** Unloads a plugin. */
  unloadPlugin(pluginId: string): Promise<void>;

  // Registries exposed to the React UI or Engine
  getCommands(): CommandDefinition[];
  getWidgets(): WidgetDefinition[];
  getReminders(): ReminderDefinition[];
}

export function createPluginManager(brain: Brain, eventBus: EventBus): PluginManager {
  const loadedPlugins = new Map<string, MitraPlugin>();
  
  // Registries
  const commands = new Map<string, CommandDefinition>();
  const widgets = new Map<string, WidgetDefinition>();
  const reminders = new Map<string, ReminderDefinition>();

  // Utility to check permissions securely
  const requirePermission = (plugin: MitraPlugin, permission: PluginPermission) => {
    if (!plugin.manifest.permissions.includes(permission)) {
      throw new Error(`[PluginManager] Plugin "${plugin.manifest.id}" lacks required permission: "${permission}"`);
    }
  };

  /**
   * Adapts the engine's internal BehaviorContext into the safe PluginBehaviorContext.
   */
  const wrapContext = (context: BehaviorContext): PluginBehaviorContext => ({
    getEnvironment: () => context.environment,
    getCharacterState: () => context.character,
    requestEmotion: (emotion) => context.pushEmotion(emotion),
    requestMovement: (intent) => context.requestMovement(intent),
    setAnimation: (animation) => context.setAnimation(animation),
  });

  return {
    async loadPlugin(plugin: MitraPlugin) {
      if (loadedPlugins.has(plugin.manifest.id)) {
        console.warn(`[PluginManager] Plugin ${plugin.manifest.id} is already loaded.`);
        return;
      }

      // 1. Install lifecycle (if new)
      if (plugin.onInstall) {
        await plugin.onInstall();
      }

      // 2. Build the secure API facade for this specific plugin
      const api: PluginAPI = {
        onEvent: (event, handler) => {
          return eventBus.subscribe(event, handler);
        },
        registerBehavior: (pluginBehavior: PluginBehavior) => {
          requirePermission(plugin, "behaviors");
          
          // Wrap the plugin behavior into an internal RegisteredBehavior
          const internalBehavior: RegisteredBehavior = {
            definition: pluginBehavior.definition,
            canExecute: (context) => pluginBehavior.canExecute(wrapContext(context)),
            execute: (context) => pluginBehavior.execute(wrapContext(context)),
          };
          
          brain.registerBehavior(internalBehavior);
        },
        registerCommand: (command: CommandDefinition) => {
          requirePermission(plugin, "commands");
          commands.set(command.id, command);
        },
        registerWidget: (widget: WidgetDefinition) => {
          requirePermission(plugin, "widgets");
          widgets.set(widget.id, widget);
        },
        registerReminder: (reminder: ReminderDefinition) => {
          requirePermission(plugin, "reminders");
          reminders.set(reminder.id, reminder);
        }
      };

      // 3. Initialize
      await plugin.onInitialize(api);

      // 4. Enable
      if (plugin.onEnable) {
        await plugin.onEnable();
      }

      loadedPlugins.set(plugin.manifest.id, plugin);
      console.log(`[PluginManager] Loaded plugin: ${plugin.manifest.name} v${plugin.manifest.version}`);
    },

    async unloadPlugin(pluginId: string) {
      const plugin = loadedPlugins.get(pluginId);
      if (!plugin) return;

      if (plugin.onDisable) {
        await plugin.onDisable();
      }
      if (plugin.onDestroy) {
        await plugin.onDestroy();
      }

      loadedPlugins.delete(pluginId);
      
      // We would also need to clean up registered behaviors, commands, etc.
      // For now, this is a stub as unregistering behaviors from the BehaviorEngine 
      // requires additional engine support (e.g., behaviorEngine.unregister(id)).
      console.log(`[PluginManager] Unloaded plugin: ${plugin.manifest.id}`);
    },

    getCommands: () => Array.from(commands.values()),
    getWidgets: () => Array.from(widgets.values()),
    getReminders: () => Array.from(reminders.values()),
  };
}
