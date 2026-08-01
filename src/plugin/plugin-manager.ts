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
  /** Unloads all loaded plugins. */
  unloadAll(): Promise<void>;

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
  const registeredBehaviorIds = new Set<string>();

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
    getWorldState: () => context.world,
    emit: (intent) => context.emit(intent),
  });

  return {
    async loadPlugin(plugin: MitraPlugin) {
      if (loadedPlugins.has(plugin.manifest.id)) {
        console.warn(`[PluginManager] Plugin ${plugin.manifest.id} is already loaded.`);
        return;
      }

      // Build the secure API facade for this specific plugin
      
      const api: PluginAPI = {
        events: {
          emit: (intent) => {
            (brain as any).evaluateIntent?.(intent);
          },
          on: (event: any, handler: any) => {
            return eventBus.subscribe(event, handler);
          }
        },
        scheduler: (brain as any).scheduler,
        trust: {
          request: async (_perm) => true,
          get: async (_perm) => "granted",
        },
        registry: {
          registerBehavior: (pluginBehavior: PluginBehavior) => {
            requirePermission(plugin, "behaviors");
            
            const behaviorId = `plugin:${plugin.manifest.id}:${pluginBehavior.definition.id}`;
            const internalBehavior: RegisteredBehavior = {
              definition: { ...pluginBehavior.definition, id: behaviorId },
              canExecute: (context) => pluginBehavior.canExecute(wrapContext(context)),
              execute: (context) => pluginBehavior.execute(wrapContext(context)),
            };
            
            brain.registerBehavior(internalBehavior);
            registeredBehaviorIds.add(behaviorId);
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
        }
      };

      // 1. Install lifecycle (if new)
      if (plugin.onInstall) {
        await plugin.onInstall(api);
      }

      // 3. Initialize
      if (plugin.onInit) {
        await plugin.onInit(api);
      }

      // 4. Enable
      if (plugin.onEnable) {
        await plugin.onEnable(api);
      }

      loadedPlugins.set(plugin.manifest.id, plugin);
      // Silently loaded
    },

    async unloadPlugin(pluginId: string) {
      const plugin = loadedPlugins.get(pluginId);
      if (!plugin) return;
      
      const dummyApi = {} as PluginAPI;

      if (plugin.onDisable) {
        await plugin.onDisable(dummyApi);
      }
      if (plugin.onDestroy) {
        await plugin.onDestroy(dummyApi);
      }

      loadedPlugins.delete(pluginId);
      
      // Clear out plugin contributions
      const prefix = `plugin:${pluginId}:`;
      
      for (const id of registeredBehaviorIds) {
        if (id.startsWith(prefix)) {
          brain.unregisterBehavior(id);
          registeredBehaviorIds.delete(id);
        }
      }
      
      // Also clean up commands, widgets, etc. here if needed.
      // Silently unloaded
    },

    async unloadAll() {
      const ids = Array.from(loadedPlugins.keys());
      for (const id of ids) {
        await this.unloadPlugin(id);
      }
    },

    getCommands: () => Array.from(commands.values()),
    getWidgets: () => Array.from(widgets.values()),
    getReminders: () => Array.from(reminders.values()),
  };
}
