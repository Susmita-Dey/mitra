import type { EventBus, EventName, EventHandler, SystemEvents, Unsubscribe } from "./event-bus";

// ---------------------------------------------------------------------------
// Batched microtask flusher
// ---------------------------------------------------------------------------
//
// Events published in the same synchronous frame are coalesced into a single
// flush pass rather than each scheduling its own independent microtask.
//
// Before (original):
//   publish("a") → queueMicrotask(handlersA)
//   publish("b") → queueMicrotask(handlersB)
//   → Two independent microtasks; handlersA may trigger state that handlersB
//     observes in an intermediate, inconsistent form.
//
// After (batched):
//   publish("a") → enqueue pending op, schedule ONE flush microtask if needed
//   publish("b") → enqueue pending op (flush already scheduled)
//   → Single microtask runs both; handlers see a consistent snapshot.
//
// Handler isolation is preserved: each handler is still called independently
// and errors are caught per-handler. The only change is that multiple publishes
// within the same synchronous call stack share one microtask boundary.
// ---------------------------------------------------------------------------

interface PendingDispatch {
  event: EventName;
  handlers: Array<EventHandler<any>>;
  payload: unknown;
}

export function createEventBus(): EventBus {
  // We use a Map of Sets for O(1) adds/removes and to prevent duplicate handlers
  const listeners = new Map<EventName, Set<EventHandler<any>>>();

  // Pending dispatches for the current synchronous frame.
  const pending: PendingDispatch[] = [];
  let flushScheduled = false;

  const flush = () => {
    flushScheduled = false;
    // Drain all pending dispatches in FIFO order.
    // We take a snapshot of the length to avoid processing events that are
    // published by handlers during this flush (they'll be picked up next tick).
    const count = pending.length;
    for (let i = 0; i < count; i++) {
      const { handlers, payload } = pending[i];
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] Error in handler:`, error);
        }
      }
    }
    pending.splice(0, count);
  };

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

      // Snapshot handlers at publish time so unsubscriptions during this
      // flush don't affect the current batch.
      const handlers = Array.from(eventListeners);

      pending.push({ event, handlers, payload });

      // Schedule a single flush microtask for this frame if not already scheduled.
      if (!flushScheduled) {
        flushScheduled = true;
        queueMicrotask(flush);
      }
    },

    clear(event?: EventName): void {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
      // Also clear any pending dispatches for the cleared event(s).
      if (event) {
        for (let i = pending.length - 1; i >= 0; i--) {
          if (pending[i].event === event) pending.splice(i, 1);
        }
      } else {
        pending.length = 0;
      }
    },
  };
}
