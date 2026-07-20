import type { Storage } from "./storage";

/**
 * Storage implementation using the browser's native localStorage API.
 * Suitable for UI preferences, window positions, and simple state.
 */
export function createBrowserStorage(): Storage {
  return {
    async load<T>(key: string): Promise<T | null> {
      try {
        const item = window.localStorage.getItem(key);
        if (item === null) return null;
        return JSON.parse(item) as T;
      } catch (error) {
        console.error(`[BrowserStorage] Failed to load key "${key}":`, error);
        return null;
      }
    },

    async save<T>(key: string, value: T): Promise<void> {
      try {
        const serialized = JSON.stringify(value);
        window.localStorage.setItem(key, serialized);
      } catch (error) {
        console.error(`[BrowserStorage] Failed to save key "${key}":`, error);
      }
    },
  };
}
