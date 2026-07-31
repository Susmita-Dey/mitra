import { useEffect, useState } from "react";
import type { AppPreferences } from "@/types";
import "./SettingsPanel.css";

export interface SettingsPanelProps {
  preferences: AppPreferences;
  onUpdatePreferences: (patch: Partial<AppPreferences>) => void;
  onClose: () => void;
}

export function SettingsPanel({ preferences, onUpdatePreferences, onClose }: SettingsPanelProps) {
  const [remindersEnabled, setRemindersEnabled] = useState(preferences.reminders.enabled);
  const [waterInterval, setWaterInterval] = useState(preferences.reminders.water.intervalMs / 1000 / 60);

  // Sync state if preferences change externally
  useEffect(() => {
    setRemindersEnabled(preferences.reminders.enabled);
    setWaterInterval(preferences.reminders.water.intervalMs / 1000 / 60);
  }, [preferences]);

  const handleSave = () => {
    onUpdatePreferences({
      reminders: {
        ...preferences.reminders,
        enabled: remindersEnabled,
        water: {
          ...preferences.reminders.water,
          intervalMs: waterInterval * 60 * 1000
        }
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
          <h3>Reminders</h3>
          <div className="setting-row">
            <label>
              <input 
                type="checkbox" 
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
              />
              Enable Reminders
            </label>
          </div>
          
          <div className="setting-row">
            <label>Water Interval (minutes)</label>
            <input 
              type="number" 
              value={waterInterval}
              onChange={(e) => setWaterInterval(Number(e.target.value))}
              disabled={!remindersEnabled}
            />
          </div>
        </section>

        <section className="settings-section">
          <h3>Plugins</h3>
          <div className="plugin-list">
            <div className="plugin-item">
              <span className="plugin-name">Hello World Plugin</span>
              <span className="plugin-status active">Active</span>
            </div>
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button className="save-btn" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}
