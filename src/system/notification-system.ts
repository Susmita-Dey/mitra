/**
 * NotificationSystem
 *
 * Intelligently delivers notifications based on Mitra's current visibility:
 *  - Visible → speech bubble (current DOM approach, no change)
 *  - Hidden (meeting/busy mode) → queue the notification silently
 *    - On resurface: flush queue as a single OS toast summary notification
 *
 * This ensures the user never misses a reminder even during meetings,
 * while keeping the experience non-intrusive.
 */

export interface PendingNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

export interface NotificationSystem {
  /** Notify the system that Mitra just became visible again (resurface). */
  onResurface(): void;
  /** Deliver a notification. Will queue silently if Mitra is currently hidden. */
  notify(title: string, body: string): void;
  /** Tell the system whether Mitra is currently hidden. */
  setHidden(isHidden: boolean): void;
  /** Returns a copy of the current pending queue. */
  getPendingQueue(): PendingNotification[];
}

type ToastFn = (title: string, body: string) => void;

export function createNotificationSystem(sendToast: ToastFn): NotificationSystem {
  const queue: PendingNotification[] = [];
  let isHidden = false;
  let idCounter = 0;

  const flush = () => {
    if (queue.length === 0) return;

    if (queue.length === 1) {
      const n = queue[0];
      sendToast(n.title, n.body);
    } else {
      const titles = queue.map(n => `• ${n.title}`).join("\n");
      sendToast(
        `Mitra caught up — ${queue.length} reminders`,
        `While you were away:\n${titles}`
      );
    }

    queue.length = 0; // clear
  };

  return {
    setHidden(hidden: boolean) {
      isHidden = hidden;
    },

    notify(title: string, body: string) {
      if (isHidden) {
        // Queue silently — do not disturb the meeting
        queue.push({
          id: `notif-${++idCounter}`,
          title,
          body,
          timestamp: Date.now(),
        });
      } else {
        // Mitra is visible — let the Brain handle the speech bubble as usual.
        // We use the toast only as a fallback. Nothing to do here since the
        // existing reminder behaviors drive the bubble & sound.
      }
    },

    onResurface() {
      if (queue.length > 0) {
        flush();
      }
    },

    getPendingQueue() {
      return [...queue];
    },
  };
}
