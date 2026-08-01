import { AppStorage } from "@/storage/app-storage";
import { TrustState, TrustPreferences } from "@/types";

export interface TrustManager {
  /** Get the current state of a specific trust permission */
  get(permission: keyof TrustPreferences): Promise<TrustState>;
  
  /** Update the state of a specific trust permission */
  set(permission: keyof TrustPreferences, state: TrustState): Promise<void>;
  
  /** 
   * Evaluate if a permission should be requested.
   */
  shouldRequest(permission: keyof TrustPreferences): Promise<boolean>;
}

export function createTrustManager(appStorage: AppStorage): TrustManager {
  return {
    async get(permission) {
      const prefs = await appStorage.load();
      return prefs.trust?.[permission] || "unknown";
    },
    
    async set(permission, state) {
      const prefs = await appStorage.load();
      const newTrust = { ...prefs.trust, [permission]: state };
      await appStorage.update({ trust: newTrust as TrustPreferences });
    },
    
    async shouldRequest(permission) {
      const prefs = await appStorage.load();
      const state = prefs.trust?.[permission] || "unknown";
      
      // If they explicitly denied or granted, do not prompt again.
      // If it's "off" or "approximate", they made a choice in settings.
      // We only prompt if it's "unknown".
      return state === "unknown";
    }
  };
}
