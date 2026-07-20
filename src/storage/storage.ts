/** Offline-first persistence boundary. Backends swap without touching callers. */
export interface Storage {
  load<T>(key: string): Promise<T | null>;
  save<T>(key: string, value: T): Promise<void>;
}
