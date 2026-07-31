import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { AppPreferences } from "@/types";
import { createAppStorage } from "@/storage/app-storage";
import { createBrowserStorage } from "@/storage/browser-storage";
import "@/components/SettingsPanel.css";
import "./global.css"; // Ensure global styles are applied

export function SettingsPage() {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [waterInterval, setWaterInterval] = useState(120);
  const [stretchInterval, setStretchInterval] = useState(60);
  const [eyesInterval, setEyesInterval] = useState(30);
  
  const [muteSounds, setMuteSounds] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  const [clickThrough, setClickThrough] = useState(false);
  const [wanderEnabled, setWanderEnabled] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState("");

  const appStorage = createAppStorage(createBrowserStorage());

  useEffect(() => {
    appStorage.load().then(prefs => {
      setPreferences(prefs);
      setRemindersEnabled(prefs.reminders?.enabled ?? true);
      setWaterInterval((prefs.reminders?.water?.intervalMs ?? 7200000) / 1000 / 60);
      setStretchInterval((prefs.reminders?.stretch?.intervalMs ?? 3600000) / 1000 / 60);
      setEyesInterval((prefs.reminders?.eyes?.intervalMs ?? 1800000) / 1000 / 60);
      setMuteSounds(prefs.audio?.muteSounds ?? false);
      setVolume(prefs.audio?.volume ?? 0.5);
      setClickThrough(prefs.behavior?.clickThrough ?? false);
      setWanderEnabled(prefs.behavior?.wanderEnabled ?? false);
      setWeatherLocation(prefs.behavior?.weatherLocation ?? "");
    });
  }, []);

  const handleSave = async () => {
    await appStorage.update({
      reminders: {
        ...(preferences?.reminders || {}),
        enabled: remindersEnabled,
        quietHoursStart: preferences?.reminders?.quietHoursStart ?? "22:00",
        quietHoursEnd: preferences?.reminders?.quietHoursEnd ?? "08:00",
        lunch: preferences?.reminders?.lunch ?? { intervalMs: 14400000, jitterMs: 900000 },
        water: { ...(preferences?.reminders?.water || { jitterMs: 600000 }), intervalMs: waterInterval * 60 * 1000 },
        stretch: { ...(preferences?.reminders?.stretch || { jitterMs: 300000 }), intervalMs: stretchInterval * 60 * 1000 },
        eyes: { ...(preferences?.reminders?.eyes || { jitterMs: 120000 }), intervalMs: eyesInterval * 60 * 1000 },
      },
      audio: {
        ...(preferences?.audio || {}),
        muteSounds,
        volume,
      },
      behavior: {
        ...(preferences?.behavior || { idleAnimations: true, interactionLevel: "normal" }),
        clickThrough,
        wanderEnabled,
        weatherLocation,
      }
    });
    getCurrentWindow().hide();
  };

  if (!preferences) return <div>Loading...</div>;

  return (
    <div className="settings-panel" style={{ position: 'relative', width: '100%', height: '100vh', borderRadius: 0 }}>
      <div className="settings-header">
        <h2>Mitra Settings</h2>
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h3>Behaviors</h3>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={clickThrough} onChange={(e) => setClickThrough(e.target.checked)} />
              Click-Through Mode (Ignores mouse when idle)
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input 
                type="checkbox" 
                checked={wanderEnabled}
                onChange={e => setWanderEnabled(e.target.checked)}
              />
              Wander Around Screen
            </label>
          </div>
          <div className="setting-row">
            <label>
              Weather Location
              <input 
                type="text" 
                placeholder="e.g. Ranaghat, WB"
                value={weatherLocation}
                onChange={e => setWeatherLocation(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>Audio</h3>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={muteSounds} onChange={(e) => setMuteSounds(e.target.checked)} />
              Mute All Sounds
            </label>
          </div>
          <div className="setting-row">
            <label>Volume</label>
            <input type="range" min="0" max="1" step="0.1" value={volume} disabled={muteSounds} onChange={(e) => setVolume(Number(e.target.value))} />
          </div>
        </section>

        <section className="settings-section">
          <h3>Reminders</h3>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={remindersEnabled} onChange={(e) => setRemindersEnabled(e.target.checked)} />
              Enable Reminders
            </label>
          </div>
          <div className="setting-row">
            <label>Water Interval (mins)</label>
            <input type="number" value={waterInterval} disabled={!remindersEnabled} onChange={(e) => setWaterInterval(Number(e.target.value))} />
          </div>
          <div className="setting-row">
            <label>Stretch Interval (mins)</label>
            <input type="number" value={stretchInterval} disabled={!remindersEnabled} onChange={(e) => setStretchInterval(Number(e.target.value))} />
          </div>
          <div className="setting-row">
            <label>Eyes Interval (mins)</label>
            <input type="number" value={eyesInterval} disabled={!remindersEnabled} onChange={(e) => setEyesInterval(Number(e.target.value))} />
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button className="save-btn" onClick={handleSave}>Save Changes</button>
        <button className="exit-btn" onClick={() => getCurrentWindow().hide()}>Cancel</button>
      </div>
    </div>
  );
}
