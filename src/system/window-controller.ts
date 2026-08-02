/**
 * Low-level interface to the native OS window.
 *
 * This controller contains NO business logic or behavior decisions.
 * It strictly executes commands requested by higher-level systems (like the Brain).
 *
 * All methods are asynchronous as they cross the Tauri IPC boundary.
 */
export interface WindowController {
  // ── Implemented Features ─────────────────────────────────────────────────

  /** Initiates an OS-native drag of the window. */
  startDrag(): Promise<void>;

  /** Moves the window instantly to absolute physical coordinates. */
  moveTo(x: number, y: number): Promise<void>;

  /**
   * Snaps the window to the nearest edge of the monitor it currently resides on.
   * Ensures the window remains fully visible.
   */
  snapToEdge(): Promise<void>;

  /** Toggles whether the window floats above all other applications. */
  setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;

  /** Restores the window position from storage on startup. */
  restorePosition(): Promise<void>;

  // ── Prepared Interfaces (Future Capabilities) ──────────────────────────

  /** Moves the window to absolute coordinates using a smooth animation. */
  animateTo(x: number, y: number): Promise<void>;

  /** Hides the companion window completely from the screen. */
  hide(): Promise<void>;

  /** Shows the companion window if it was hidden. */
  show(): Promise<void>;

  /** Minimizes the companion to the taskbar/dock. */
  minimize(): Promise<void>;

  /** Restores the companion from a minimized state. */
  restore(): Promise<void>;

  /**
   * Click-through mode. If true, mouse events pass through the companion
   * to the applications underneath.
   */
  setIgnoreCursorEvents(ignore: boolean): Promise<void>;

  /** Cleans up window listeners. */
  dispose(): void;
}
