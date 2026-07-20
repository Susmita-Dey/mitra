import type { EventBus, EventName, EventHandler, SystemEvents, Unsubscribe } from "./event-bus";

export function createEventBus(): EventBus {
  // We use a Map of Sets for O(1) adds/removes and to prevent duplicate handlers
  const listeners = new Map<EventName, Set<EventHandler<any>>>();

  return {
    subscribe<K extends EventName>(event: K, handler: EventHandler<SystemEvents[K]>): Unsubscribe {
      let eventListeners = listeners.get(event);
      if (!eventListeners) {
        eventListeners = new Set();
        listeners.set(event, eventListeners);
      }

      eventListeners.add(handler);

      return () => {
        const currentListeners = listeners.get(event);
        if (currentListeners) {
          currentListeners.delete(handler);
          // Cleanup empty sets to prevent memory leaks over time
          if (currentListeners.size === 0) {
            listeners.delete(event);
          }
        }
      };
    },

    publish<K extends EventName>(event: K, payload: SystemEvents[K]): void {
      const eventListeners = listeners.get(event);
      if (!eventListeners || eventListeners.size === 0) return;

      // Create a snapshot of handlers to prevent issues if handlers unsubscribe during execution
      const handlersToExecute = Array.from(eventListeners);

      // Execute asynchronously in the next microtask (async-safe decoupled execution)
      queueMicrotask(() => {
        for (const handler of handlersToExecute) {
          try {
            handler(payload);
          } catch (error) {
            console.error(`[EventBus] Error in handler for event "${event}":`, error);
          }
        }
      });
    },

    clear(event?: EventName): void {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },
  };
}
