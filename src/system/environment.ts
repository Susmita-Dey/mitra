/**
 * A point-in-time snapshot of the observable environment.
 *
 * All fields are read-only. The EnvironmentService is the sole writer.
 * The Brain reads this snapshot in observe() and makes it available to behaviors.
 *
 * Privacy contract:
 *   - No application names, URLs, or window titles are collected.
 *   - No mouse coordinates are stored beyond a movement flag.
 *   - No key values or sequences are recorded — only timing of activity.
 *   - Screen dimensions are integer pixel counts — no fingerprinting identifiers.
 */
export interface EnvironmentSnapshot {
  /** Milliseconds since last detected mouse movement. */
  readonly mouseIdleMs: number;

  /** Milliseconds since last detected keyboard activity. */
  readonly keyboardIdleMs: number;

  /**
   * Unified idle duration: the lesser of mouseIdleMs and keyboardIdleMs.
   * This is the primary signal for sleep/wake behavior transitions.
   */
  readonly idleMs: number;

  /** True if the user moved the mouse in the last observation window (1s). */
  readonly mouseActive: boolean;

  /** True if the user pressed a key in the last observation window (1s). */
  readonly keyboardActive: boolean;

  /** True if the Mitra webview window currently has focus. */
  readonly windowFocused: boolean;

  /** True if the mouse cursor is currently inside the Mitra window bounds. */
  readonly cursorInWindow: boolean;

  /** Primary monitor width in physical pixels. */
  readonly screenWidth: number;

  /** Primary monitor height in physical pixels. */
  readonly screenHeight: number;

  /** Device pixel ratio of the primary monitor (e.g. 1.0, 1.5, 2.0). */
  readonly devicePixelRatio: number;

  /** Total number of connected monitors. null if not yet queried. */
  readonly monitorCount: number | null;

  /** Timestamp (ms) when this snapshot was captured. */
  readonly capturedAt: number;
}

/**
 * EnvironmentService — observes the OS and webview environment.
 *
 * Manages its own DOM listeners and timer-based polling.
 * Call dispose() to clean up all listeners when the app unmounts.
 */
export interface EnvironmentService {
  /** Returns the most recent environment snapshot. */
  getSnapshot(): EnvironmentSnapshot;
  /** Removes all DOM listeners and clears all timers. */
  dispose(): void;
}
