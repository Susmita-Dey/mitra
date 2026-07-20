import type { Storage } from "./storage";

/** In-memory storage for development until a durable backend is chosen. */
export function createMemoryStorage(): Storage {
  const store = new Map<string, unknown>();

  return {
    async load<T>(key: string): Promise<T | null> {
      const value = store.get(key);
      return value === undefined ? null : (value as T);
    },

    async save<T>(key: string, value: T): Promise<void> {
      store.set(key, value);
    },
  };
}
