import { getCurrentWindow, PhysicalPosition, currentMonitor, availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
import type { WindowController } from "./window-controller";
import type { AppStorage } from "../storage";

const EDGE_MARGIN_PX = 16;

export function createWindowController(storage: AppStorage): WindowController {
  const win = getCurrentWindow();
  
  // Track position automatically on move to persist it
  win.onMoved(async ({ payload }) => {
    // Debounce or just save directly since onMoved isn't insanely spammy in Tauri usually,
    // but better to debounce if performance becomes an issue.
    await storage.update({ windowPosition: { x: payload.x, y: payload.y } });
  });

  return {
    async startDrag() {
      await win.startDragging();
    },

    async moveTo(x: number, y: number) {
      await win.setPosition(new PhysicalPosition(x, y));
    },

    async animateTo(_x: number, _y: number) {
      // Future: Implement smooth stepping or native animation
      console.warn("[WindowController] animateTo not yet implemented");
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
        // Verify the saved position is inside at least one connected monitor
        const isVisible = monitors.some((m: import("@tauri-apps/api/window").Monitor) => {
          const mLeft = m.position.x;
          const mRight = m.position.x + m.size.width;
          const mTop = m.position.y;
          const mBottom = m.position.y + m.size.height;
          
          return (
            savedPos.x + winSize.width > mLeft &&
            savedPos.x < mRight &&
            savedPos.y + winSize.height > mTop &&
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
