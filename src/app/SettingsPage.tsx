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
  const [userBirthday, setUserBirthday] = useState("");
  
  const [muteSounds, setMuteSounds] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  const [clickThrough, setClickThrough] = useState(false);
  const [wanderEnabled, setWanderEnabled] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [hideDuringMeetings, setHideDuringMeetings] = useState(false);
  
  const [sunglasses, setSunglasses] = useState(false);
  const [towel, setTowel] = useState(false);
  const [mug, setMug] = useState(false);

  // Mitra+ License State (Mocked for now)
  const [hasMitraPlus] = useState(false);

  const [locationTrust, setLocationTrust] = useState<"unknown" | "granted" | "denied" | "approximate" | "off">("approximate");

  const appStorage = createAppStorage(createBrowserStorage());

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let isMounted = true;
    
    const setupCloseHandler = async () => {
      try {
        const win = getCurrentWindow();
        const unlistenFn = await win.onCloseRequested((event) => {
          event.preventDefault();
          win.hide();
        });
        if (isMounted) {
          unlisten = unlistenFn;
        } else {
          unlistenFn();
        }
      } catch (err) {
        console.error("Failed to setup close handler", err);
      }
    };
    setupCloseHandler();

    appStorage.load().then(prefs => {
      if (!isMounted) return;
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
      setUserBirthday(prefs.birthday ?? "");
      
      setSunglasses(prefs.costumes?.sunglasses ?? false);
      setTowel(prefs.costumes?.towel ?? false);
      setMug(prefs.costumes?.mug ?? false);

      setLocationTrust(prefs.trust?.location ?? "approximate");
    });

    return () => {
      isMounted = false;
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
      },
      trust: {
        ...(preferences?.trust || {
          microphone: "unknown",
          camera: "unknown",
          notifications: "unknown",
          accessibility: "unknown",
          autostart: "unknown",
          calendar: "unknown",
          spotify: "unknown",
          slack: "unknown",
          discord: "unknown",
        } as const),
        location: locationTrust,
      },
      birthday: userBirthday
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
        <h2>Settings</h2>
      </div>

      <div className="settings-content">
        {hasMitraPlus ? (
          <section className="settings-section mitra-plus-section" style={{ position: 'relative', background: 'linear-gradient(135deg, #1f1c2c 0%, #928DAB 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h3 style={{ color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Mitra+ Integrations
            </h3>
            <p style={{ fontSize: '11px', opacity: 0.9, marginBottom: '16px', lineHeight: '1.4' }}>
              Supercharge your workflow. Mitra+ turns your companion into a professional assistant that understands your workday.
            </p>

            <div className="mitra-plus-plugins" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="plugin-card" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    Media Session
                  </strong>
                  <span style={{ fontSize: '10px', background: '#FCD34D', color: '#1f1c2c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PRO</span>
                </div>
                <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 10px 0' }}>Reacts to local media (Spotify, VLC, YouTube).</p>
                <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                  Connect
                </button>
              </div>

              <div className="plugin-card" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
                    Slack Sync
                  </strong>
                  <span style={{ fontSize: '10px', background: '#FCD34D', color: '#1f1c2c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PRO</span>
                </div>
                <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 10px 0' }}>Auto-update Slack status when in deep focus.</p>
                <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                  Connect
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="settings-section">
          <h3>Personalize</h3>
          <div className="setting-row">
            <label>
              Your Birthday
              <input 
                type="date" 
                value={userBirthday ? `2000-${userBirthday}` : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const parts = val.split('-');
                    setUserBirthday(`${parts[1]}-${parts[2]}`);
                  } else {
                    setUserBirthday("");
                  }
                }}
                className="premium-input"
              />
            </label>
          </div>
        </section>

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
          <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Privacy & Trust</h3>
          
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ marginBottom: '12px' }}><strong>Location Data</strong></label>
            <div className="radio-card-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', width: '100%' }}>
              <label className={`radio-card ${locationTrust === "off" ? "active" : ""}`}>
                <input type="radio" name="location" value="off" checked={locationTrust === "off"} onChange={() => setLocationTrust("off")} style={{ display: 'none' }} />
                <div className="radio-card-content">
                  <span className="radio-card-title">Off</span>
                  <span className="radio-card-desc">No Weather Features</span>
                </div>
              </label>
              <label className={`radio-card ${(locationTrust === "approximate" || locationTrust === "unknown") ? "active" : ""}`}>
                <input type="radio" name="location" value="approximate" checked={locationTrust === "approximate" || locationTrust === "unknown"} onChange={() => setLocationTrust("approximate")} style={{ display: 'none' }} />
                <div className="radio-card-content">
                  <span className="radio-card-title">Approximate</span>
                  <span className="radio-card-desc">Based on IP address</span>
                </div>
              </label>
              <label className={`radio-card ${locationTrust === "granted" ? "active" : ""}`}>
                <input type="radio" name="location" value="granted" checked={locationTrust === "granted"} onChange={() => {
                  setLocationTrust("granted");
                  if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(() => {}, () => {});
                  }
                }} style={{ display: 'none' }} />
                <div className="radio-card-content">
                  <span className="radio-card-title">Precise</span>
                  <span className="radio-card-desc">Best Weather Accuracy</span>
                </div>
              </label>
            </div>
            {locationTrust === "denied" && <div className="trust-warning" style={{ fontSize: '0.85em', color: '#EF4444', marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4, verticalAlign: '-1px'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>Precise Location Denied. Using approximate location.</div>}
          </div>

          <div className="privacy-dashboard" style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(145deg, rgba(232, 106, 51, 0.05), rgba(194, 79, 30, 0.1))', borderRadius: '12px', border: '1px solid rgba(232, 106, 51, 0.2)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#C24F1E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Mitra Privacy Promise
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85em', color: '#334155' }}>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No telemetry</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Runs locally</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Weather only</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No screenshots</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No microphone</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No camera</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No cloud AI processing</li>
            </ul>
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

        <section className="settings-section premium-reminders-section">
          <div className="reminders-header">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              Smart Reminders
            </h3>
            <label className="premium-toggle">
              <input type="checkbox" checked={remindersEnabled} onChange={(e) => setRemindersEnabled(e.target.checked)} />
              <div className="premium-toggle-track"></div>
            </label>
          </div>

          <div className={`reminders-grid ${!remindersEnabled ? 'disabled' : ''}`}>
            <div className="premium-reminder-card">
              <div className="card-icon water-icon">💧</div>
              <div className="card-content">
                <label>Water</label>
                <div className="input-group">
                  <span>Every</span>
                  <input type="number" value={waterInterval} disabled={!remindersEnabled} onChange={(e) => setWaterInterval(Number(e.target.value))} />
                  <span>m</span>
                </div>
              </div>
            </div>

            <div className="premium-reminder-card">
              <div className="card-icon stretch-icon">🧘</div>
              <div className="card-content">
                <label>Stretch</label>
                <div className="input-group">
                  <span>Every</span>
                  <input type="number" value={stretchInterval} disabled={!remindersEnabled} onChange={(e) => setStretchInterval(Number(e.target.value))} />
                  <span>m</span>
                </div>
              </div>
            </div>

            <div className="premium-reminder-card">
              <div className="card-icon eyes-icon">👀</div>
              <div className="card-content">
                <label>Rest Eyes</label>
                <div className="input-group">
                  <span>Every</span>
                  <input type="number" min="10" value={eyesInterval} disabled={!remindersEnabled} onChange={e => setEyesInterval(Number(e.target.value))} />
                  <span>m</span>
                </div>
              </div>
            </div>

            <div className="premium-reminder-card">
              <div className="card-icon bio-icon">🏃</div>
              <div className="card-content">
                <label>Bio Break</label>
                <div className="input-group">
                  <span>Every</span>
                  <input type="number" min="30" value={bioInterval} disabled={!remindersEnabled} onChange={e => setBioInterval(Number(e.target.value))} />
                  <span>m</span>
                </div>
              </div>
            </div>

            <div className="premium-reminder-card">
              <div className="card-icon meal-icon">🍱</div>
              <div className="card-content">
                <label>Lunch</label>
                <input type="time" value={lunchTime} disabled={!remindersEnabled} onChange={(e) => setLunchTime(e.target.value)} />
              </div>
            </div>

            <div className="premium-reminder-card">
              <div className="card-icon meal-icon">🌙</div>
              <div className="card-content">
                <label>Dinner</label>
                <input type="time" value={dinnerTime} disabled={!remindersEnabled} onChange={(e) => setDinnerTime(e.target.value)} />
              </div>
            </div>

            <div className="premium-reminder-card">
              <div className="card-icon snack-icon">🍎</div>
              <div className="card-content">
                <label>Snack</label>
                <input type="time" value={snackTime} disabled={!remindersEnabled} onChange={(e) => setSnackTime(e.target.value)} />
              </div>
            </div>
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
