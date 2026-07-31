/**
 * BatterySystem - Wraps the browser navigator.getBattery API
 */

export interface BatteryState {
  level: number;       // 0.0 to 1.0
  charging: boolean;
  supported: boolean;
}

export interface BatterySystem {
  getState(): BatteryState;
  start(): void;
}

export function createBatterySystem(): BatterySystem {
  let currentState: BatteryState = {
    level: 1.0,
    charging: true,
    supported: false,
  };

  return {
    start() {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          currentState.supported = true;
          
          const updateState = () => {
            currentState.level = battery.level;
            currentState.charging = battery.charging;
          };
          
          updateState();
          
          battery.addEventListener('levelchange', updateState);
          battery.addEventListener('chargingchange', updateState);
        }).catch((err: any) => {
          console.warn("[BatterySystem] Failed to access battery API", err);
        });
      } else {
        console.warn("[BatterySystem] navigator.getBattery not supported in this WebView.");
      }
    },
    getState() {
      return currentState;
    }
  };
}
