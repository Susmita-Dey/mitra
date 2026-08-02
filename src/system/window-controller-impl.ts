import { getCurrentWindow, PhysicalPosition, currentMonitor, availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
import type { WindowController } from "./window-controller";
import type { AppStorage } from "../storage";

const EDGE_MARGIN_PX = 16;

export function createWindowController(storage: AppStorage): WindowController {
  const win = getCurrentWindow();
  
  let moveTimeout: ReturnType<typeof setTimeout>;
  // Track position automatically on move to persist it
  const unlistenMovedPromise = win.onMoved(({ payload }) => {
    // Tauri often fires (0,0) or spurious moves during initialization.
    // Also debounce to avoid spamming storage.
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(async () => {
      // Ignore exact 0,0 which is the default spawn point before restorePosition hits
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
      await win.startDragging();
    },

    async moveTo(x: number, y: number) {
      await win.setPosition(new PhysicalPosition(x, y));
    },

    async animateTo(x: number, y: number) {
      // Future: Implement smooth stepping or native animation.
      // For now, gracefully fall back to an instant move so intents don't fail silently.
      await this.moveTo(x, y);
    },

    async snapToEdge() {
      const monitor = await currentMonitor();
      if (!monitor) return;

      const pos = await win.outerPosition();
      const size = await win.outerSize();
      const monPos = monitor.position;
      const monSize = monitor.size;

      // Distance to each edge (accounting for monitor offset)
      const distLeft = pos.x - monPos.x;
      const distRight = (monPos.x + monSize.width) - (pos.x + size.width);
      const distTop = pos.y - monPos.y;
      const distBottom = (monPos.y + monSize.height) - (pos.y + size.height);

      // Find the minimum distance
      const min = Math.min(distLeft, distRight, distTop, distBottom);

      let targetX = pos.x;
      let targetY = pos.y;

      if (min === distLeft) {
        targetX = monPos.x + EDGE_MARGIN_PX;
      } else if (min === distRight) {
        targetX = monPos.x + monSize.width - size.width - EDGE_MARGIN_PX;
      } else if (min === distTop) {
        targetY = monPos.y + EDGE_MARGIN_PX;
      } else if (min === distBottom) {
        targetY = monPos.y + monSize.height - size.height - EDGE_MARGIN_PX;
      }

      await this.moveTo(targetX, targetY);
    },

    async setAlwaysOnTop(alwaysOnTop: boolean) {
      await win.setAlwaysOnTop(alwaysOnTop);
    },

    async restorePosition() {
      const prefs = await storage.load();
      const savedPos = prefs.windowPosition;
      const monitors = await availableMonitors();
      const primary = await primaryMonitor() ?? monitors[0];

      if (!primary) return; // Headless environment fallback

      if (savedPos) {
        const winSize = await win.outerSize();
        const w = winSize.width > 0 ? winSize.width : 200;
        const h = winSize.height > 0 ? winSize.height : 200;
        
        // Verify the saved position is inside at least one connected monitor
        const isVisible = monitors.some((m: import("@tauri-apps/api/window").Monitor) => {
          const mLeft = m.position.x;
          const mRight = m.position.x + m.size.width;
          const mTop = m.position.y;
          const mBottom = m.position.y + m.size.height;
          
          return (
            savedPos.x + w > mLeft &&
            savedPos.x < mRight &&
            savedPos.y + h > mTop &&
            savedPos.y < mBottom
          );
        });

        if (isVisible) {
          await this.moveTo(savedPos.x, savedPos.y);
          return;
        }
      }

      // Default fallback: bottom-right of primary monitor
      const defaultX = primary.position.x + primary.size.width - 300 - EDGE_MARGIN_PX;
      const defaultY = primary.position.y + primary.size.height - 300 - EDGE_MARGIN_PX;
      await this.moveTo(defaultX, defaultY);
    },

    async hide() {
      await win.hide();
    },

    async show() {
      await win.show();
    },

    async minimize() {
      await win.minimize();
    },

    async restore() {
      await win.unminimize();
    },

    async setIgnoreCursorEvents(ignore: boolean) {
      await win.setIgnoreCursorEvents(ignore);
    },
  };
}
