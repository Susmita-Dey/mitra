/**
 * Maps event names to their expected payload types.
 */
export interface SystemEvents {
  "preferences:updated": import("@/types").AppPreferences;
  // Prepared for future extension:
  // "reminder:triggered": { reminderId: string };
  // "character:changed": { newCharacter: string };
  // "window:moved": { x: number, y: number };
}

export type EventName = keyof SystemEvents;

export type EventHandler<T> = (payload: T) => void;

/**
 * An unsubscribe callback to remove a listener.
 */
export type Unsubscribe = () => void;

/**
 * The internal Event Bus for decoupled communication between engine modules.
 * This ensures that modules (like Storage, Brain, UI) don't need direct references
 * to each other for cross-cutting concerns like preference updates or alerts.
 */
export interface EventBus {
  /**
   * Subscribe to a specific event. Returns a function to unsubscribe.
   */
  subscribe<K extends EventName>(event: K, handler: EventHandler<SystemEvents[K]>): Unsubscribe;

  /**
   * Publish an event asynchronously. The handlers run in the next microtask
   * to ensure async safety and prevent synchronous event cascades.
   */
  publish<K extends EventName>(event: K, payload: SystemEvents[K]): void;

  /**
   * Clears all listeners for a specific event, or all listeners globally if no event is specified.
   */
  clear(event?: EventName): void;
}
