import { useState, useEffect, useRef } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createBrowserStorage } from "@/storage/browser-storage";
import { createAppStorage } from "@/storage/app-storage";
import { createEventBus } from "@/system/event-bus-impl";
import "./Onboarding.css";

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [storage, setStorage] = useState<any>(null);
  const [nameShake, setNameShake] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const eventBus = createEventBus();
    const backend = createBrowserStorage();
    const appStorage = createAppStorage(backend, eventBus);
    appStorage.load().then(() => setStorage(appStorage)).catch(console.error);
  }, []);

  const handleNext = () => setStep(2);

  const triggerShake = () => {
    setNameShake(true);
    setTimeout(() => setNameShake(false), 600);
    nameInputRef.current?.focus();
  };

  const handleComplete = async () => {
    if (!storage) return;
    if (!userName.trim()) {
      triggerShake();
      return;
    }
    try {
      const bday = birthday || "";
      await storage.update({ onboardingComplete: true, userName: userName.trim(), birthday: bday });
      
      // Close onboarding window and show main window
      try {
        const mainWindow = await WebviewWindow.getByLabel("main");
        if (mainWindow) await mainWindow.show();
      } catch (err) {
        console.warn("Could not find main window by label:", err);
      }
      
      const { emit } = await import("@tauri-apps/api/event");
      await emit("onboarding-completed");
      
      await getCurrentWindow().close();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      await getCurrentWindow().close();
    }
  };

  if (!storage) return null;

  return (
    <div className="onboarding-overlay" data-tauri-drag-region style={{ margin: 0, height: '100vh', width: '100vw' }}>
      <div className="onboarding-modal glass-panel">
        {step === 1 && (
          <div className="onboarding-step">
            <h1><span className="brand-text">Meet Mitra</span> <img src="/icon.png" alt="Mitra" style={{ width: '36px', height: '36px', objectFit: 'contain' }} /></h1>
            <p>
              Mitra is your little companion who lives on your desktop. Not a tool — a friend who keeps you company while you work.
            </p>
            <ul className="onboarding-features">
              <li><span className="emoji-icon">💧</span> <span>Reminds you to drink water, stretch, and take breaks.</span></li>
              <li><span className="emoji-icon">🌤️</span> <span>Reacts to your local weather — sunny, rainy, or stormy.</span></li>
              <li><span className="emoji-icon">🖱️</span> <span>Drag Mitra anywhere. Mitra will wander, sleep, and explore on their own.</span></li>
              <li><span className="emoji-icon">💖</span> <span>Pet Mitra, tickle their tummy, or give a high-five!</span></li>
              <li><span className="emoji-icon">🔔</span> <span>Stays silent during meetings. Catches you up when you're back.</span></li>
            </ul>
            <button className="onboarding-btn primary" onClick={handleNext}>
              Sounds good →
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="onboarding-step">
            <h1><span className="brand-text">What's your name?</span></h1>
            <p>
              Mitra loves greeting friends by name. 🦊
            </p>
            <input 
              ref={nameInputRef}
              type="text" 
              placeholder="Your name" 
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (userName.trim()) handleComplete();
                  else triggerShake();
                }
              }}
              className={nameShake ? "shake" : ""}
              style={{
                width: '100%',
                padding: '10px',
                margin: '15px 0 5px 0',
                borderRadius: '8px',
                border: nameShake ? '2px solid #ef4444' : '2px solid transparent',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
            {nameShake && (
              <p style={{ fontSize: '11px', color: '#ef4444', margin: '0 0 8px 0', textAlign: 'left' }}>
                Please enter your name first 😊
              </p>
            )}
            <div style={{ textAlign: 'left', marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>When is your birthday? (Optional)</label>
              <input 
                type="date" 
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '14px', color: '#334155', boxSizing: 'border-box' }}
              />
            </div>
            <p className="highlight-text" style={{ fontSize: '11px', marginTop: '10px', opacity: 0.7 }}>
              You can find Mitra's settings by clicking the <strong>⚙️ gear icon</strong> that appears when you hover over Mitra.
            </p>
            <button className="onboarding-btn success" onClick={handleComplete} disabled={!userName.trim()}>
              Let's go, {userName.trim().split(" ")[0] || "friend"}! 🎉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
