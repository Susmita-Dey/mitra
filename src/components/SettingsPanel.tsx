import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { AppPreferences } from "@/types";
import "./SettingsPanel.css";

export interface SettingsPanelProps {
  preferences: AppPreferences;
  onUpdatePreferences: (patch: Partial<AppPreferences>) => void;
  onClose: () => void;
}

export function SettingsPanel({ preferences, onUpdatePreferences, onClose }: SettingsPanelProps) {
  const [remindersEnabled, setRemindersEnabled] = useState(preferences?.reminders?.enabled ?? true);
  const [waterInterval, setWaterInterval] = useState((preferences?.reminders?.water?.intervalMs ?? 7200000) / 1000 / 60);
  const [stretchInterval, setStretchInterval] = useState((preferences?.reminders?.stretch?.intervalMs ?? 3600000) / 1000 / 60);
  const [eyesInterval, setEyesInterval] = useState((preferences?.reminders?.eyes?.intervalMs ?? 1800000) / 1000 / 60);
  
  const [muteSounds, setMuteSounds] = useState(preferences?.audio?.muteSounds ?? false);
  const [volume, setVolume] = useState(preferences?.audio?.volume ?? 0.5);
  
  const [clickThrough, setClickThrough] = useState(preferences?.behavior?.clickThrough ?? false);
  const [wanderEnabled, setWanderEnabled] = useState(preferences?.behavior?.wanderEnabled ?? false);
  const [weatherLocation, setWeatherLocation] = useState(preferences?.behavior?.weatherLocation ?? "");

  useEffect(() => {
    setRemindersEnabled(preferences?.reminders?.enabled ?? true);
    setWaterInterval((preferences?.reminders?.water?.intervalMs ?? 7200000) / 1000 / 60);
    setStretchInterval((preferences?.reminders?.stretch?.intervalMs ?? 3600000) / 1000 / 60);
    setEyesInterval((preferences?.reminders?.eyes?.intervalMs ?? 1800000) / 1000 / 60);
    setMuteSounds(preferences?.audio?.muteSounds ?? false);
    setVolume(preferences?.audio?.volume ?? 0.5);
    setClickThrough(preferences?.behavior?.clickThrough ?? false);
    setWanderEnabled(preferences?.behavior?.wanderEnabled ?? false);
    setWeatherLocation(preferences?.behavior?.weatherLocation ?? "");
  }, [preferences]);

  const handleSave = () => {
    onUpdatePreferences({
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
    onClose();
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Mitra Settings</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
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
        <button className="exit-btn" onClick={() => getCurrentWindow().close()}>Say Goodbye ✖</button>
      </div>
    </div>
  );
}
