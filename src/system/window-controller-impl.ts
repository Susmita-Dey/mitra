import { getCurrentWindow, PhysicalPosition, currentMonitor, availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
import type { WindowController } from "./window-controller";
import type { AppStorage } from "../storage";

const EDGE_MARGIN_PX = 16;
const MAX_STATE_QUEUE_DEPTH = 5;

// ---------------------------------------------------------------------------
// Serial IPC Queue
// ---------------------------------------------------------------------------
//
// All Tauri window operations must be serialized — the Rust window handle is
// single-threaded and concurrent IPC calls cause black windows, flickering,
// and "Not Responding" hangs in production builds.
//
// Two queues:
//   1. moveQueue  — coalescing queue for moveTo/animateTo. Only the LATEST
//                   pending destination is kept; stale moves are discarded.
//   2. stateQueue — serial queue for all other operations (hide, show,
//                   setIgnoreCursorEvents, setAlwaysOnTop, etc.). These are
//                   never dropped, but depth is capped at MAX_STATE_QUEUE_DEPTH.
//
// Both queues share a single `running` promise chain so they interleave safely.
// ---------------------------------------------------------------------------

type IpcOp = () => Promise<void>;

function createIpcQueue() {
  // The tail of the current promise chain — all new ops append here.
  let chain: Promise<void> = Promise.resolve();

  // Pending coalesced move: only the latest requested target is remembered.
  let pendingMove: IpcOp | null = null;
  let moveScheduled = false;

  // Pending state ops (non-movement). Capped at MAX_STATE_QUEUE_DEPTH.
  const stateQueue: IpcOp[] = [];
  let draining = false;

  function drainStateQueue() {
    if (draining || stateQueue.length === 0) return;
    draining = true;
    const op = stateQueue.shift()!;
    chain = chain
      .then(op)
      .catch(console.error)
      .finally(() => {
        draining = false;
        drainStateQueue();
      });
  }

  return {
    /**
     * Enqueue a movement operation. Consecutive calls collapse into the latest
     * target — intermediate positions are discarded.
     */
    enqueueMove(op: IpcOp) {
      pendingMove = op; // overwrite — only keep latest

      if (!moveScheduled) {
        moveScheduled = true;
        // Schedule on the chain so it runs after any in-flight op.
        chain = chain
          .then(() => {
            moveScheduled = false;
            if (pendingMove) {
              const latest = pendingMove;
              pendingMove = null;
              return latest();
            }
          })
          .catch(console.error);
      }
    },

    /**
     * Enqueue a state-changing operation (hide, show, setIgnoreCursorEvents,
     * etc.). These are never coalesced but queue depth is capped.
     */
    enqueueState(op: IpcOp) {
      if (stateQueue.length >= MAX_STATE_QUEUE_DEPTH) {
        // Safety: drop the oldest pending op to prevent runaway queuing.
        stateQueue.shift();
        console.warn("[WindowController] IPC state queue depth exceeded — oldest op dropped.");
      }
      stateQueue.push(op);
      drainStateQueue();
    },
  };
}

export function createWindowController(storage: AppStorage): WindowController {
  let lastPosition: { x: number; y: number } | null = null;
  let alwaysOnTop = true;
  let ignoreCursor = false;
  const win = getCurrentWindow();
  const ipc = createIpcQueue();

  let moveTimeout: ReturnType<typeof setTimeout>;
  // Track position automatically on move to persist it.
  const unlistenMovedPromise = win.onMoved(({ payload }) => {
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(async () => {
      // Ignore exact 0,0 which is the default spawn point before restorePosition hits.
      if (payload.x === 0 && payload.y === 0) return;
      await storage.update({ windowPosition: { x: payload.x, y: payload.y } });
    }, 500);
  });

  return {
    dispose() {
      clearTimeout(moveTimeout);
      unlistenMovedPromise.then((unlisten) => unlisten()).catch(console.error);
    },

    async startDrag() {
      // startDrag is a direct user gesture — no queue needed.
      await win.startDragging();
    },

    moveTo(x: number, y: number): Promise<void> {
      if (
        lastPosition &&
        lastPosition.x === x &&
        lastPosition.y === y
      ) {
        return Promise.resolve();
      }

      lastPosition = { x, y };

      return new Promise<void>((resolve) => {
        ipc.enqueueMove(async () => {
          await win.setPosition(new PhysicalPosition(x, y));
          resolve();
        });
      });
    },

    async animateTo(x: number, y: number) {
      // Future: smooth stepping. For now falls through to instant move.
      return this.moveTo(x, y);
    },

    async snapToEdge() {
      const monitor = await currentMonitor();
      if (!monitor) return;

      const pos = await win.outerPosition();
      const size = await win.outerSize();
      const monPos = monitor.position;
      const monSize = monitor.size;

      const distLeft   = pos.x - monPos.x;
      const distRight  = (monPos.x + monSize.width)  - (pos.x + size.width);
      const distTop    = pos.y - monPos.y;
      const distBottom = (monPos.y + monSize.height) - (pos.y + size.height);

      const min = Math.min(distLeft, distRight, distTop, distBottom);

      let targetX = pos.x;
      let targetY = pos.y;

      if (min === distLeft)        targetX = monPos.x + EDGE_MARGIN_PX;
      else if (min === distRight)  targetX = monPos.x + monSize.width  - size.width  - EDGE_MARGIN_PX;
      else if (min === distTop)    targetY = monPos.y + EDGE_MARGIN_PX;
      else if (min === distBottom) targetY = monPos.y + monSize.height - size.height - EDGE_MARGIN_PX;

      return this.moveTo(targetX, targetY);
    },

    setAlwaysOnTop(value: boolean): Promise<void> {
      if (alwaysOnTop === value) return Promise.resolve();
      alwaysOnTop = value;

      return new Promise<void>((resolve) => {
        ipc.enqueueState(async () => {
          await win.setAlwaysOnTop(value);
          resolve();
        });
      });
    },

    async restorePosition() {
      const prefs = await storage.load();
      const savedPos = prefs.windowPosition;

      if (
        lastPosition &&
        savedPos &&
        lastPosition.x === savedPos.x &&
        lastPosition.y === savedPos.y
      ) {
        return;
      }

      const monitors = await availableMonitors();
      const primary = await primaryMonitor() ?? monitors[0];

      if (!primary) return; // Headless environment fallback

      if (savedPos) {
        const winSize = await win.outerSize();
        const w = winSize.width  > 0 ? winSize.width  : 200;
        const h = winSize.height > 0 ? winSize.height : 200;

        const isVisible = monitors.some((m: import("@tauri-apps/api/window").Monitor) => {
          const mLeft   = m.position.x;
          const mRight  = m.position.x + m.size.width;
          const mTop    = m.position.y;
          const mBottom = m.position.y + m.size.height;

          return (
            savedPos.x + w > mLeft  &&
            savedPos.x     < mRight &&
            savedPos.y + h > mTop   &&
            savedPos.y     < mBottom
          );
        });

        if (isVisible) {
          return this.moveTo(savedPos.x, savedPos.y);
        }
      }

      // Default fallback: bottom-right of primary monitor
      const defaultX = primary.position.x + primary.size.width  - 300 - EDGE_MARGIN_PX;
      const defaultY = primary.position.y + primary.size.height - 300 - EDGE_MARGIN_PX;
      return this.moveTo(defaultX, defaultY);
    },

    hide(): Promise<void> {
      return new Promise<void>((resolve) => {
        ipc.enqueueState(async () => {
          await win.hide();
          resolve();
        });
      });
    },

    show(): Promise<void> {
      return new Promise<void>((resolve) => {
        ipc.enqueueState(async () => {
          await win.show();
          resolve();
        });
      });
    },

    minimize(): Promise<void> {
      return new Promise<void>((resolve) => {
        ipc.enqueueState(async () => {
          await win.minimize();
          resolve();
        });
      });
    },

    restore(): Promise<void> {
      return new Promise<void>((resolve) => {
        ipc.enqueueState(async () => {
          await win.unminimize();
          resolve();
        });
      });
    },

    setIgnoreCursorEvents(ignore: boolean): Promise<void> {
      if (ignoreCursor === ignore) return Promise.resolve();
      ignoreCursor = ignore;

      return new Promise<void>((resolve) => {
        ipc.enqueueState(async () => {
          await win.setIgnoreCursorEvents(ignore);
          resolve();
        });
      });
    },
  };
}
