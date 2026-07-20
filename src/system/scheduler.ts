/**
 * A time duration or a random range of durations [minMs, maxMs].
 */
export type TimeRange = number | [number, number];

export interface ScheduleOptions {
  /** If set, the task will run once after this delay (or random delay within range). */
  delayMs?: TimeRange;

  /** If set, the task will run repeatedly at this interval (or random interval within range). */
  intervalMs?: TimeRange;

  /**
   * Priority bracket. Higher values execute first when multiple tasks
   * are due at the exact same moment. Defaults to 0.
   */
  priority?: number;

  /**
   * Optional custom ID. If omitted, one will be generated.
   * Useful if you want to cancel a specific recurring task by a known ID.
   */
  id?: string;
}

export interface TaskHandle {
  id: string;
  cancel: () => void;
}

/**
 * A centralized scheduling service.
 * Prevents the need for scattered setTimeout / setInterval calls.
 */
export interface SchedulerService {
  /** Schedule an action to be executed in the future. */
  schedule(action: () => void, options: ScheduleOptions): TaskHandle;

  /** Cancel a task by its ID. */
  cancel(id: string): void;

  /** Cancel all pending tasks. */
  cancelAll(): void;

  /** Stop the scheduler and clear all tasks. */
  dispose(): void;
}
