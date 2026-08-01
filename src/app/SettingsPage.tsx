import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { AppPreferences } from "@/types";
import { createAppStorage } from "@/storage/app-storage";
import { createBrowserStorage } from "@/storage/browser-storage";
import "@/components/SettingsPanel.css";
import "./global.css"; // Ensure global styles are applied

export function SettingsPage() {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [errorMsg] = useState<string | null>(null);
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [waterInterval, setWaterInterval] = useState(120);
  const [stretchInterval, setStretchInterval] = useState(60);
  const [eyesInterval, setEyesInterval] = useState(30);
  const [bioInterval, setBioInterval] = useState(120);

  const [lunchTime, setLunchTime] = useState("13:00");
  const [dinnerTime, setDinnerTime] = useState("20:00");
  const [snackTime, setSnackTime] = useState("17:00");
  
  const [muteSounds, setMuteSounds] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  const [clickThrough, setClickThrough] = useState(false);
  const [wanderEnabled, setWanderEnabled] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [hideDuringMeetings, setHideDuringMeetings] = useState(false);
  
  const [sunglasses, setSunglasses] = useState(false);
  const [towel, setTowel] = useState(false);
  const [mug, setMug] = useState(false);

  const appStorage = createAppStorage(createBrowserStorage());

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupCloseHandler = async () => {
      try {
        const win = getCurrentWindow();
        unlisten = await win.onCloseRequested((event) => {
          event.preventDefault();
          win.hide();
        });
      } catch (err) {
        console.error("Failed to setup close handler", err);
      }
    };
    setupCloseHandler();

    appStorage.load().then(prefs => {
      setPreferences(prefs);
      setRemindersEnabled(prefs.reminders?.enabled ?? true);
      setWaterInterval((prefs.reminders?.water?.intervalMs ?? 7200000) / (60 * 1000));
      setStretchInterval((prefs.reminders?.stretch?.intervalMs ?? 3600000) / (60 * 1000));
      setEyesInterval((prefs.reminders?.eyes?.intervalMs ?? 1800000) / (60 * 1000));
      setBioInterval((prefs.reminders?.bio?.intervalMs ?? 7200000) / (60 * 1000));

      setLunchTime(prefs.reminders?.lunch?.time ?? "13:00");
      setDinnerTime(prefs.reminders?.dinner?.time ?? "20:00");
      setSnackTime(prefs.reminders?.snack?.time ?? "17:00");
      setMuteSounds(prefs.audio?.muteSounds ?? false);
      setVolume(prefs.audio?.volume ?? 0.5);
      setClickThrough(prefs.behavior?.clickThrough ?? false);
      setWanderEnabled(prefs.behavior?.wanderEnabled ?? false);
      setWeatherLocation(prefs.behavior?.weatherLocation ?? "");
      setHideDuringMeetings(prefs.behavior?.hideDuringMeetings ?? false);
      
      setSunglasses(prefs.costumes?.sunglasses ?? false);
      setTowel(prefs.costumes?.towel ?? false);
      setMug(prefs.costumes?.mug ?? false);
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleSave = async () => {
    await appStorage.update({
      reminders: {
        ...(preferences?.reminders || {}),
        enabled: remindersEnabled,
        quietHoursStart: preferences?.reminders?.quietHoursStart ?? "22:00",
        quietHoursEnd: preferences?.reminders?.quietHoursEnd ?? "08:00",
        lunch: { ...(preferences?.reminders?.lunch || { intervalMs: 0, jitterMs: 900000 }), time: lunchTime },
        dinner: { ...(preferences?.reminders?.dinner || { intervalMs: 0, jitterMs: 900000 }), time: dinnerTime },
        snack: { ...(preferences?.reminders?.snack || { intervalMs: 0, jitterMs: 900000 }), time: snackTime },
        water: { ...(preferences?.reminders?.water || { jitterMs: 600000 }), intervalMs: waterInterval * 60 * 1000 },
        stretch: { ...(preferences?.reminders?.stretch || { jitterMs: 300000 }), intervalMs: stretchInterval * 60 * 1000 },
        eyes: { ...(preferences?.reminders?.eyes || { jitterMs: 120000 }), intervalMs: eyesInterval * 60 * 1000 },
        bio: { ...(preferences?.reminders?.bio || { jitterMs: 900000 }), intervalMs: bioInterval * 60 * 1000 },
      },
      audio: {
        ...(preferences?.audio || {}),
        muteSounds,
        volume,
      },
      behavior: {
        ...(preferences?.behavior || { idleAnimations: true, interactionLevel: "normal", clickThrough: false, wanderEnabled: false }),
        clickThrough,
        wanderEnabled,
        weatherLocation,
        hideDuringMeetings,
      },
      costumes: {
        sunglasses,
        towel,
        mug,
      }
    });
    try {
      await getCurrentWindow().hide();
    } catch (err) {
      console.error("Failed to hide window", err);
    }
  };

  if (!preferences) return <div>Loading...</div>;

  return (
    <div className="settings-panel" style={{ position: 'relative', width: '100%', height: '100vh', borderRadius: 0 }}>
      {errorMsg && <div className="error-banner">{errorMsg}</div>}
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
              <input 
                type="checkbox" 
                checked={hideDuringMeetings}
                onChange={e => setHideDuringMeetings(e.target.checked)}
              />
              Hide During Busy Timings (Meetings)
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
          <h3>Costumes & Props</h3>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={sunglasses} onChange={(e) => setSunglasses(e.target.checked)} />
              😎 Sunglasses
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={towel} onChange={(e) => setTowel(e.target.checked)} />
              🏖️ Beach Towel
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={mug} onChange={(e) => setMug(e.target.checked)} />
              ☕ Coffee Mug
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
          <div className="setting-row inline">
            <label>Rest Eyes every</label>
            <input type="number" min="10" value={eyesInterval} onChange={e => setEyesInterval(Number(e.target.value))} />
            <span>mins</span>
          </div>
          <div className="setting-row inline">
            <label>Bio Break every</label>
            <input type="number" min="30" value={bioInterval} onChange={e => setBioInterval(Number(e.target.value))} />
            <span>mins</span>
          </div>

          <div className="setting-row inline">
            <label>Lunch Time</label>
            <input type="time" value={lunchTime} disabled={!remindersEnabled} onChange={(e) => setLunchTime(e.target.value)} />
          </div>
          <div className="setting-row">
            <label>Dinner Time</label>
            <input type="time" value={dinnerTime} disabled={!remindersEnabled} onChange={(e) => setDinnerTime(e.target.value)} />
          </div>
          <div className="setting-row">
            <label>Snack Time</label>
            <input type="time" value={snackTime} disabled={!remindersEnabled} onChange={(e) => setSnackTime(e.target.value)} />
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button className="save-btn" onClick={handleSave}>Save Changes</button>
        <button className="exit-btn" onClick={async () => {
          try {
            await getCurrentWindow().hide();
          } catch(e) {
             console.error(e);
          }
        }}>Cancel</button>
      </div>
    </div>
  );
}
