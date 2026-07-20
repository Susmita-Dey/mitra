import type { EnvironmentService, EnvironmentSnapshot } from "./environment";

/**
 * Tauri command payload for screen information.
 * Returned by the `get_screen_info` Rust command.
 */
interface ScreenInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  monitorCount: number;
}

/**
 * Attempt to fetch screen info from the Tauri backend.
 * Falls back to window.screen values if running outside Tauri (e.g., dev browser).
 */
async function fetchScreenInfo(): Promise<ScreenInfo> {
  try {
    // Tauri 2 invoke — the Rust command is registered in lib.rs
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<ScreenInfo>("get_screen_info");
  } catch {
    // Graceful fallback for non-Tauri environments (Vite dev server, tests).
    return {
      width: window.screen.width,
      height: window.screen.height,
      devicePixelRatio: window.devicePixelRatio ?? 1,
      monitorCount: null as unknown as number,
    };
  }
}

/**
 * Creates the production EnvironmentService.
 *
 * Attaches DOM listeners for mouse and keyboard activity.
 * Polls the Tauri backend for screen info on initialisation.
 * Tracks window focus and cursor presence via standard browser events.
 *
 * All data collected is behavioural timing — no content, no coordinates.
 */
export function createEnvironmentService(): EnvironmentService {
  let lastMouseActivity = Date.now();
  let lastKeyboardActivity = Date.now();
  let mouseActiveThisTick = false;
  let keyboardActiveThisTick = false;
  let windowFocused = document.hasFocus();
  let cursorInWindow = false;
  let screenWidth = window.screen.width;
  let screenHeight = window.screen.height;
  let devicePixelRatio = window.devicePixelRatio ?? 1;
  let monitorCount: number | null = null;

  // ── DOM listeners ────────────────────────────────────────────────────────

  const onMouseMove = () => {
    lastMouseActivity = Date.now();
    mouseActiveThisTick = true;
  };

  const onKeyDown = () => {
    lastKeyboardActivity = Date.now();
    keyboardActiveThisTick = true;
  };

  const onFocus = () => { windowFocused = true; };
  const onBlur  = () => { windowFocused = false; };

  const onMouseEnter = () => { cursorInWindow = true; };
  const onMouseLeave = () => { cursorInWindow = false; };

  // Throttle mousemove: we only need to know "did it move?" per tick,
  // not every pixel. The flag is reset after getSnapshot() is called.
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("keydown",   onKeyDown,   { passive: true });
  window.addEventListener("focus",     onFocus,     { capture: true });
  window.addEventListener("blur",      onBlur,      { capture: true });
  document.addEventListener("mouseenter", onMouseEnter, { passive: true });
  document.addEventListener("mouseleave", onMouseLeave, { passive: true });

  // ── Screen info (async, one-time) ────────────────────────────────────────

  fetchScreenInfo().then((info) => {
    screenWidth      = info.width;
    screenHeight     = info.height;
    devicePixelRatio = info.devicePixelRatio;
    monitorCount     = info.monitorCount ?? null;
  });

  // ── Public interface ─────────────────────────────────────────────────────

  return {
    getSnapshot(): EnvironmentSnapshot {
      const now = Date.now();
      const mouseIdleMs    = now - lastMouseActivity;
      const keyboardIdleMs = now - lastKeyboardActivity;

      // Capture per-tick flags then immediately reset them.
      const mouseActive    = mouseActiveThisTick;
      const keyboardActive = keyboardActiveThisTick;
      mouseActiveThisTick    = false;
      keyboardActiveThisTick = false;

      return {
        mouseIdleMs,
        keyboardIdleMs,
        idleMs: Math.min(mouseIdleMs, keyboardIdleMs),
        mouseActive,
        keyboardActive,
        windowFocused,
        cursorInWindow,
        screenWidth,
        screenHeight,
        devicePixelRatio,
        monitorCount,
        capturedAt: now,
      };
    },

    dispose() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown",   onKeyDown);
      window.removeEventListener("focus",     onFocus,     { capture: true });
      window.removeEventListener("blur",      onBlur,      { capture: true });
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeave);
    },
  };
}
