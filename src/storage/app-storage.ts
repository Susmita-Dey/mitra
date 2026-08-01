import type { Storage } from "./storage";
import { type AppPreferences, DEFAULT_PREFERENCES } from "@/types";

const PREFS_KEY = "mitra_preferences";

function deepMerge(target: any, source: any): any {
  if (typeof target !== "object" || target === null) return source;
  if (typeof source !== "object" || source === null) return source;
  
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Type of a migration function.
 * Takes the old state (as any) and returns the migrated state.
 */
type Migration = (state: any) => any;

/**
 * Ordered list of migrations.
 * The index represents the target version.
 * Example: migrations[1] migrates version 1 to version 2.
 * So to migrate from v0 (or no version) to v1, we run migrations[0].
 */
const MIGRATIONS: Record<number, Migration> = {
  // Example future migration:
  // 1: (state: any) => {
  //   return { ...state, version: 2, newFeatureFlag: true };
  // },
};

const CURRENT_VERSION = DEFAULT_PREFERENCES.version;

export interface AppStorage {
  load(): Promise<AppPreferences>;
  save(preferences: AppPreferences): Promise<void>;
  update(patch: Partial<AppPreferences>): Promise<AppPreferences>;
}

import type { EventBus } from "@/system/index";

export function createAppStorage(backend: Storage, eventBus?: EventBus): AppStorage {
  const storageInstance: AppStorage = {
    async load(): Promise<AppPreferences> {
      const raw = await backend.load<any>(PREFS_KEY);

      if (!raw) {
        // Initial setup
        await backend.save(PREFS_KEY, DEFAULT_PREFERENCES);
        return { ...DEFAULT_PREFERENCES };
      }

      let currentData = raw;

      // Ensure data has a version field, default to 0 if it's legacy data
      if (typeof currentData.version !== "number") {
        currentData.version = 0;
      }

      let migrated = false;

      // Apply migrations sequentially
      while (currentData.version < CURRENT_VERSION) {
        const migration = MIGRATIONS[currentData.version];
        if (migration) {
          currentData = migration(currentData);
          currentData.version += 1;
          migrated = true;
        } else {
          console.warn(`[AppStorage] Missing migration for version ${currentData.version}. Resetting to defaults.`);
          currentData = { ...DEFAULT_PREFERENCES };
          migrated = true;
          break;
        }
      }

      // Deep merge missing keys and nested objects from DEFAULT_PREFERENCES
      currentData = deepMerge(DEFAULT_PREFERENCES, currentData);

      if (migrated) {
        await backend.save(PREFS_KEY, currentData);
      }

      if (eventBus) {
        eventBus.publish("preferences:updated", currentData as AppPreferences);
      }

      return currentData as AppPreferences;
    },

    async save(preferences: AppPreferences): Promise<void> {
      await backend.save(PREFS_KEY, preferences);
      if (eventBus) {
        eventBus.publish("preferences:updated", preferences);
      }
    },

    async update(patch: Partial<AppPreferences>): Promise<AppPreferences> {
      const current = await this.load();
      const updated = { ...current, ...patch };
      await this.save(updated);
      return updated;
    },
  };

  // Cross-window synchronization
  // When the Settings window writes to localStorage, this event fires in the Main window
  window.addEventListener('storage', async (e) => {
    if (e.key === PREFS_KEY) {
      // Reload from storage and publish event to update memory
      await storageInstance.load();
      
    }
  });

  return storageInstance;
}
