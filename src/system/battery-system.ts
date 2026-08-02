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
  dispose(): void;
}

export function createBatterySystem(): BatterySystem {
  let currentState: BatteryState = {
    level: 1.0,
    charging: true,
    supported: false,
  };

  let batteryObj: any = null;
  let updateStateCallback: (() => void) | null = null;

  return {
    start() {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          batteryObj = battery;
          currentState.supported = true;
          
          updateStateCallback = () => {
            currentState.level = battery.level;
            currentState.charging = battery.charging;
          };
          
          updateStateCallback();
          
          battery.addEventListener('levelchange', updateStateCallback);
          battery.addEventListener('chargingchange', updateStateCallback);
        }).catch((err: any) => {
          console.warn("[BatterySystem] Failed to access battery API", err);
        });
      } else {
        console.warn("[BatterySystem] navigator.getBattery not supported in this WebView.");
      }
    },
    getState() {
      return currentState;
    },
    dispose() {
      if (batteryObj && updateStateCallback) {
        batteryObj.removeEventListener('levelchange', updateStateCallback);
        batteryObj.removeEventListener('chargingchange', updateStateCallback);
      }
      batteryObj = null;
      updateStateCallback = null;
    }
  };
}
