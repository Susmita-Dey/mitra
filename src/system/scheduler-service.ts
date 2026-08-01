import type { SchedulerService, ScheduleOptions, TaskHandle, TimeRange } from "./scheduler";

/** Internal record of a scheduled task. */
interface ScheduledTask {
  id: string;
  action: () => void;
  delayMs?: TimeRange;
  intervalMs?: TimeRange;
  priority: number;
  nextExecutionMs: number;
}

function resolveDuration(range: TimeRange): number {
  if (typeof range === "number") {
    return range;
  }
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createSchedulerService(): SchedulerService {
  const tasks = new Map<string, ScheduledTask>();
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let nextWakeupMs: number | null = null;

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const scheduleNextWakeup = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    nextWakeupMs = null;

    if (tasks.size === 0) return;

    const now = Date.now();
    let soonest = Infinity;

    for (const task of tasks.values()) {
      if (task.nextExecutionMs < soonest) {
        soonest = task.nextExecutionMs;
      }
    }

    const waitMs = Math.max(0, soonest - now);
    nextWakeupMs = now + waitMs;

    // Use a single centralized setTimeout
    timerId = setTimeout(processDueTasks, waitMs);
  };

  const processDueTasks = () => {
    timerId = null;
    nextWakeupMs = null;
    const now = Date.now();

    // Find all tasks that are due
    const dueTasks: ScheduledTask[] = [];
    for (const task of tasks.values()) {
      if (task.nextExecutionMs <= now) {
        dueTasks.push(task);
      }
    }

    if (dueTasks.length === 0) {
      scheduleNextWakeup();
      return;
    }

    // Sort by priority descending (higher priority runs first)
    dueTasks.sort((a, b) => b.priority - a.priority);

    for (const task of dueTasks) {
      // It's possible a task was cancelled by a previous task in this same tick
      if (!tasks.has(task.id)) continue;

      try {
        task.action();
      } catch (err) {
        console.error(`[SchedulerService] Task ${task.id} threw an exception:`, err);
      }

      // If it's recurring, schedule the next interval
      if (task.intervalMs !== undefined && tasks.has(task.id)) {
        const interval = resolveDuration(task.intervalMs);
        // Maintain cadence without drift, but prevent stampedes if it fell too far behind
        task.nextExecutionMs = Math.max(Date.now(), task.nextExecutionMs + interval);
      } else {
        // One-off task, remove it
        tasks.delete(task.id);
      }
    }

    scheduleNextWakeup();
  };

  return {
    schedule(action: () => void, options: ScheduleOptions): TaskHandle {
      const id = options.id ?? generateId();
      
      let nextExecutionMs = Date.now();
      if (options.delayMs !== undefined) {
        nextExecutionMs += resolveDuration(options.delayMs);
      } else if (options.intervalMs !== undefined) {
        nextExecutionMs += resolveDuration(options.intervalMs);
      }

      const task: ScheduledTask = {
        id,
        action,
        delayMs: options.delayMs,
        intervalMs: options.intervalMs,
        priority: options.priority ?? 0,
        nextExecutionMs,
      };

      tasks.set(id, task);

      // Optimise wakeup: only reschedule if this task is sooner than our current wakeup
      if (nextWakeupMs === null || nextExecutionMs < nextWakeupMs) {
        scheduleNextWakeup();
      }

      return {
        id,
        cancel: () => {
          tasks.delete(id);
          // We don't need to eagerly reschedule the wakeup timer here; 
          // it will just wake up, find no due tasks, and sleep again.
        },
      };
    },

    cancel(id: string) {
      tasks.delete(id);
    },

    cancelAll() {
      tasks.clear();
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      nextWakeupMs = null;
    },

    dispose() {
      this.cancelAll();
    },
  };
}
