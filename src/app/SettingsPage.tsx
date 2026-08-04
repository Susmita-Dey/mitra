import { useEffect, useState, useMemo, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { AppPreferences } from "@/types";
import { createAppStorage } from "@/storage/app-storage";
import { createBrowserStorage } from "@/storage/browser-storage";
import "@/components/SettingsPanel.css";
import "./global.css";

function getDisplayBirthday(bday: string): string {
  if (!bday) return "";
  const parts = bday.split("-");
  if (parts.length === 3) {
    return bday;
  } else if (parts.length === 2) {
    // MM-DD stored without year — pad with a neutral year for display only
    return `2000-${bday}`;
  }
  return "";
}

function saveBirthday(rawDateValue: string): string {
  // rawDateValue is "YYYY-MM-DD" from the date input.
  // If the year is exactly 2000, it means the user didn't change the padding year;
  // store only MM-DD to avoid committing a wrong birth year.
  if (!rawDateValue) return "";
  const parts = rawDateValue.split("-");
  if (parts.length === 3 && parts[0] === "2000") {
    return `${parts[1]}-${parts[2]}`;
  }
  return rawDateValue;
}

/** Parse a simple reminder string from the inline form */
function parseInlineReminder(_label: string, timeInput: string): {
  intervalMs?: number;
  time?: string;
  countdownMs?: number;
  triggerType: "interval" | "time" | "countdown";
} | null {
  const t = timeInput.trim().toLowerCase();

  // "every Xm" or "every Xh"
  const everyMatch = t.match(/^every\s+(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$/);
  if (everyMatch) {
    const val = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    const ms = unit.startsWith("h") ? val * 60 * 60 * 1000 : val * 60 * 1000;
    return { triggerType: "interval", intervalMs: ms };
  }

  // "in Xm" or "in Xh"
  const inMatch = t.match(/^in\s+(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$/);
  if (inMatch) {
    const val = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const ms = unit.startsWith("h") ? val * 60 * 60 * 1000 : val * 60 * 1000;
    return { triggerType: "countdown", countdownMs: ms };
  }

  // "HH:MM" or "H:MM am/pm" or "Hpm"
  const timeMatch = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3];
    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    if (!ampm && hours <= 12) {
      const now = new Date();
      if (now.getHours() >= hours && now.getHours() < hours + 12) hours += 12;
    }
    const pad = (n: number) => n.toString().padStart(2, "0");
    return { triggerType: "time", time: `${pad(hours)}:${pad(minutes)}` };
  }

  return null;
}

export function SettingsPage() {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

  const [locationTrust, setLocationTrust] = useState<"unknown" | "granted" | "denied" | "approximate" | "off">("approximate");

  // Inline add-reminder form state
  const [newReminderLabel, setNewReminderLabel] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [addReminderError, setAddReminderError] = useState("");

  // Mitra+ License State (Mocked for now)
  const [hasMitraPlus] = useState(false);

  const appStorage = useMemo(() => createAppStorage(createBrowserStorage()), []);

  const applyPrefs = useCallback((prefs: AppPreferences) => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unlisten: (() => void) | undefined;

    const setupCloseHandler = async () => {
      try {
        const win = getCurrentWindow();
        const unlistenFn = await win.onCloseRequested((event) => {
          event.preventDefault();
          win.hide();
        });
        if (isMounted) unlisten = unlistenFn;
        else unlistenFn();
      } catch (err) {
        console.error("Failed to setup close handler", err);
      }
    };
    setupCloseHandler();

    const loadPrefs = () => {
      appStorage.load().then(prefs => {
        if (!isMounted) return;
        applyPrefs(prefs);
      }).catch(console.error);
    };

    // Initial load
    loadPrefs();

    // Reload whenever another window (e.g. companion) updates localStorage
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "mitra_preferences" && isMounted && !document.hasFocus()) {
        loadPrefs();
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // Also reload when the settings window is shown/focused
    // (handles the case where companion added a reminder while settings was hidden)
    // window.addEventListener("focus", handleFocus); // reserved for future use

    return () => {
      isMounted = false;
      if (unlisten) unlisten();
      appStorage.dispose();
      window.removeEventListener("storage", handleStorageEvent);
      // window.removeEventListener("focus", handleFocus);
    };
  }, [applyPrefs]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await appStorage.update({
        reminders: {
          ...(preferences?.reminders || {}),
          enabled: remindersEnabled,
          quietHoursStart: preferences?.reminders?.quietHoursStart ?? "22:00",
          quietHoursEnd: preferences?.reminders?.quietHoursEnd ?? "08:00",
          lunch: { ...(preferences?.reminders?.lunch || { intervalMs: 0, jitterMs: 900000 }), time: lunchTime },
          dinner: { ...(preferences?.reminders?.dinner || { intervalMs: 0, jitterMs: 900000 }), time: dinnerTime },
          snack: { ...(preferences?.reminders?.snack || { intervalMs: 0, jitterMs: 900000 }), time: snackTime },
          water: { ...(preferences?.reminders?.water || { jitterMs: 600000 }), intervalMs: Math.max(1, waterInterval) * 60 * 1000 },
          stretch: { ...(preferences?.reminders?.stretch || { jitterMs: 300000 }), intervalMs: Math.max(1, stretchInterval) * 60 * 1000 },
          eyes: { ...(preferences?.reminders?.eyes || { jitterMs: 120000 }), intervalMs: Math.max(1, eyesInterval) * 60 * 1000 },
          bio: { ...(preferences?.reminders?.bio || { jitterMs: 900000 }), intervalMs: Math.max(1, bioInterval) * 60 * 1000 },
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
        costumes: { sunglasses, towel, mug },
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
        birthday: saveBirthday(userBirthday),
        customReminders: preferences?.customReminders || [],
      });
      // setSaveStatus("saved");
      // setTimeout(() => setSaveStatus("idle"), 1500);
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 1500);

      // Don't auto-hide.
      // Let user press Close.
      // try { await getCurrentWindow().hide(); } catch (_) {}
    } catch (err) {
      console.error("Failed to save settings", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleAddReminder = async () => {
    setAddReminderError("");
    const label = newReminderLabel.trim();
    const timeStr = newReminderTime.trim();
    if (!label) { setAddReminderError("Please enter a reminder name."); return; }
    if (!timeStr) { setAddReminderError("Please enter a time (e.g. 8pm, every 2h, in 30m)."); return; }

    const parsed = parseInlineReminder(label, timeStr);
    if (!parsed) {
      setAddReminderError("Can't understand that time. Try: 8pm · every 2h · in 30m");
      return;
    }

    const newReminder = {
      id: `custom_${Date.now()}`,
      label,
      type: "other" as const,
      enabled: true,
      intervalMs: parsed.intervalMs,
      time: parsed.time,
      countdownMs: parsed.countdownMs,
      createdAt: Date.now(),
    };

    const updatedList = [...(preferences?.customReminders || []), newReminder];
    try {
      await appStorage.update({ customReminders: updatedList });
      setPreferences(prev => prev ? { ...prev, customReminders: updatedList } : prev);
      setNewReminderLabel("");
      setNewReminderTime("");
    } catch (err) {
      setAddReminderError("Failed to save reminder. Please try again.");
    }
  };

  if (!preferences) return <div style={{ padding: 20, fontFamily: "Inter, sans-serif", color: "#666" }}>Loading…</div>;

  return (
    <div className="settings-panel" style={{ position: 'relative', width: '100%', height: '100vh', borderRadius: 0 }}>
      <div className="settings-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="settings-content">
        {hasMitraPlus && (
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
                <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' }}>Connect</button>
              </div>
            </div>
          </section>
        )}

        <section className="settings-section">
          <h3>Personalize</h3>
          <div className="setting-row">
            <label>
              Your Birthday
              <input
                type="date"
                value={getDisplayBirthday(userBirthday)}
                onChange={(e) => setUserBirthday(e.target.value)}
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
              <input type="checkbox" checked={wanderEnabled} onChange={e => setWanderEnabled(e.target.checked)} />
              Wander Around Screen
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input type="checkbox" checked={hideDuringMeetings} onChange={e => setHideDuringMeetings(e.target.checked)} />
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
          <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Privacy &amp; Trust</h3>

          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ marginBottom: '12px' }}><strong>Location Data</strong></label>
            <div className="radio-card-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', width: '100%' }}>
              <label className={`radio-card ${locationTrust === "off" ? "active" : ""}`}>
                <input type="radio" name="location" value="off" checked={locationTrust === "off"} onChange={() => setLocationTrust("off")} style={{ display: 'none' }} />
                <div className="radio-card-content"><span className="radio-card-title">Off</span><span className="radio-card-desc">No Weather Features</span></div>
              </label>
              <label className={`radio-card ${(locationTrust === "approximate" || locationTrust === "unknown") ? "active" : ""}`}>
                <input type="radio" name="location" value="approximate" checked={locationTrust === "approximate" || locationTrust === "unknown"} onChange={() => setLocationTrust("approximate")} style={{ display: 'none' }} />
                <div className="radio-card-content"><span className="radio-card-title">Approximate</span><span className="radio-card-desc">Based on IP address</span></div>
              </label>
              <label className={`radio-card ${locationTrust === "granted" ? "active" : ""}`}>
                <input type="radio" name="location" value="granted" checked={locationTrust === "granted"} onChange={() => { setLocationTrust("granted"); if ("geolocation" in navigator) { navigator.geolocation.getCurrentPosition(() => {}, () => {}); } }} style={{ display: 'none' }} />
                <div className="radio-card-content"><span className="radio-card-title">Precise</span><span className="radio-card-desc">Best Weather Accuracy</span></div>
              </label>
            </div>
            {locationTrust === "denied" && <div className="trust-warning" style={{ fontSize: '0.85em', color: '#EF4444', marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}>Precise Location Denied. Using approximate location.</div>}
          </div>

          <div className="privacy-dashboard" style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(145deg, rgba(232, 106, 51, 0.05), rgba(194, 79, 30, 0.1))', borderRadius: '12px', border: '1px solid rgba(232, 106, 51, 0.2)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#C24F1E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Mitra Privacy Promise
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85em', color: '#334155' }}>
              {["No telemetry", "Runs locally", "Weather only", "No screenshots", "No microphone", "No camera"].map(item => (
                <li key={item} style={{display: 'flex', alignItems: 'center', gap: '6px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>{item}</li>
              ))}
              <li style={{display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E86A33" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>No cloud AI processing</li>
            </ul>
          </div>
        </section>

        <section className="settings-section">
          <h3>Costumes &amp; Props</h3>
          <div className="setting-row"><label><input type="checkbox" checked={sunglasses} onChange={(e) => setSunglasses(e.target.checked)} /> 😎 Sunglasses</label></div>
          <div className="setting-row"><label><input type="checkbox" checked={towel} onChange={(e) => setTowel(e.target.checked)} /> 🏖️ Beach Towel</label></div>
          <div className="setting-row"><label><input type="checkbox" checked={mug} onChange={(e) => setMug(e.target.checked)} /> ☕ Coffee Mug</label></div>
        </section>

        <section className="settings-section">
          <h3>Audio</h3>
          <div className="setting-row"><label><input type="checkbox" checked={muteSounds} onChange={(e) => setMuteSounds(e.target.checked)} /> Mute All Sounds</label></div>
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
                  <input type="number" min="1" value={waterInterval} disabled={!remindersEnabled} onChange={(e) => setWaterInterval(Math.max(1, Number(e.target.value)))} />
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
                  <input type="number" min="1" value={stretchInterval} disabled={!remindersEnabled} onChange={(e) => setStretchInterval(Math.max(1, Number(e.target.value)))} />
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
                  <input type="number" min="1" value={eyesInterval} disabled={!remindersEnabled} onChange={(e) => setEyesInterval(Math.max(1, Number(e.target.value)))} />
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
                  <input type="number" min="1" value={bioInterval} disabled={!remindersEnabled} onChange={(e) => setBioInterval(Math.max(1, Number(e.target.value)))} />
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

        {/* ── Custom Reminders ── */}
        <section className="settings-section premium-reminders-section" style={{ marginTop: '24px' }}>
          <div className="reminders-header" style={{ marginBottom: '12px' }}>
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Custom Reminders
            </h3>
          </div>

          {!remindersEnabled && (
            <div style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
              ⚠️ Smart Reminders are currently <strong>paused</strong>. Custom reminders won't fire until you re-enable them above.
            </div>
          )}

          {/* Inline Add Reminder Form */}
          <div style={{ background: 'rgba(232,106,51,0.05)', border: '1px dashed rgba(232,106,51,0.35)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C24F1E', marginBottom: '8px' }}>+ Add a Reminder</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="What? e.g. Take medicine"
                value={newReminderLabel}
                onChange={e => { setNewReminderLabel(e.target.value); setAddReminderError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAddReminder()}
                style={{ flex: '1 1 120px', padding: '6px 10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '11px', fontFamily: 'Inter, sans-serif', outline: 'none', minWidth: 0 }}
              />
              <input
                type="text"
                placeholder="When? e.g. 8pm · every 2h · in 30m"
                value={newReminderTime}
                onChange={e => { setNewReminderTime(e.target.value); setAddReminderError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAddReminder()}
                style={{ flex: '1 1 140px', padding: '6px 10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '11px', fontFamily: 'Inter, sans-serif', outline: 'none', minWidth: 0 }}
              />
              <button
                onClick={handleAddReminder}
                style={{ background: 'linear-gradient(135deg, #E86A33, #C24F1E)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}
              >
                Add
              </button>
            </div>
            {addReminderError && (
              <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '6px' }}>{addReminderError}</div>
            )}
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
              Or press <strong style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '0 3px', borderRadius: '3px' }}>Ctrl+K</strong> on the companion
            </div>
          </div>

          <div className="custom-reminders-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!(preferences.customReminders || []) || (preferences.customReminders || []).length === 0) ? (
              <div style={{ fontSize: '11px', opacity: 0.5, padding: '12px', textAlign: 'center' }}>
                No custom reminders yet — add one above!
              </div>
            ) : (
              (preferences.customReminders || []).map((reminder) => {
                let emoji = "🔔";
                if (reminder.type === "medicine") emoji = "💊";
                if (reminder.type === "posture") emoji = "🧘";
                if (reminder.type === "coffee") emoji = "☕";
                if (reminder.type === "coding break") emoji = "💻";
                if (reminder.type === "meetings") emoji = "📅";
                if (reminder.type === "lunch") emoji = "🍜";

                let scheduleText = "";
                if (reminder.countdownMs) {
                  const minutes = Math.round(reminder.countdownMs / 60000);
                  scheduleText = minutes > 0 ? `Once, in ${minutes} mins` : `Once, in ${Math.round(reminder.countdownMs / 1000)} secs`;
                } else if (reminder.time) {
                  scheduleText = `Daily at ${reminder.time}`;
                } else if (reminder.intervalMs) {
                  const minutes = Math.round(reminder.intervalMs / 60000);
                  scheduleText = minutes > 0 ? `Every ${minutes} mins` : `Every ${Math.round(reminder.intervalMs / 1000)} secs`;
                }

                return (
                  <div key={reminder.id} className="premium-reminder-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', width: '100%', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="card-icon" style={{ fontSize: '20px', minWidth: '24px' }}>{emoji}</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{reminder.label}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{scheduleText}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <label className="premium-toggle" style={{ transform: 'scale(0.85)', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={reminder.enabled}
                          onChange={async (e) => {
                            const updatedList = (preferences.customReminders || []).map(r =>
                              r.id === reminder.id ? { ...r, enabled: e.target.checked } : r
                            );
                            setPreferences({ ...preferences, customReminders: updatedList });
                            await appStorage.update({ customReminders: updatedList });
                          }}
                        />
                        <div className="premium-toggle-track"></div>
                      </label>

                      <button
                        onClick={async () => {
                          const updatedList = (preferences.customReminders || []).filter(r => r.id !== reminder.id);
                          setPreferences({ ...preferences, customReminders: updatedList });
                          await appStorage.update({ customReminders: updatedList });
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', transition: 'background 0.15s' }}
                        title="Delete reminder"
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'none')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          style={{ opacity: saveStatus === "saving" ? 0.7 : 1 }}
        >
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved!" : saveStatus === "error" ? "⚠ Error — try again" : "Save Changes"}
        </button>
        <button className="exit-btn" onClick={async () => {
          try { await getCurrentWindow().hide(); } catch(e) { console.error(e); }
        }}>Close</button>
      </div>
    </div>
  );
}
