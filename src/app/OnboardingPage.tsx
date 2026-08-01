import { useState, useEffect } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createBrowserStorage } from "@/storage/browser-storage";
import { createAppStorage } from "@/storage/app-storage";
import { createEventBus } from "@/system/event-bus-impl";
import "./Onboarding.css";

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [storage, setStorage] = useState<any>(null);

  useEffect(() => {
    const eventBus = createEventBus();
    const backend = createBrowserStorage();
    const appStorage = createAppStorage(backend, eventBus);
    appStorage.load().then(() => setStorage(appStorage)).catch(console.error);
  }, []);

  const handleNext = () => setStep(2);
  const handleComplete = async () => {
    if (!storage) return;
    await storage.update({ onboardingComplete: true, userName: userName.trim() });
    
    // Close onboarding window and show main window
    const mainWindow = await WebviewWindow.getByLabel("main");
    if (mainWindow) {
      await mainWindow.show();
    }
    await getCurrentWindow().close();
  };

  if (!storage) return null;

  return (
    <div className="onboarding-overlay" style={{ background: '#1f1c2c', margin: 0, height: '100vh', width: '100vw' }}>
      <div className="onboarding-modal glass-panel">
        {step === 1 && (
          <div className="onboarding-step">
            <h1>Meet Mitra 🐾</h1>
            <p>
              Mitra is your little companion who lives on your desktop. He's not a tool — he's a friend who keeps you company while you work.
            </p>
            <ul className="onboarding-features">
              <li>💧 Reminds you to drink water, stretch, and take breaks.</li>
              <li>🌤️ Reacts to your local weather — sunny, rainy, or stormy.</li>
              <li>🖱️ Drag him anywhere. He'll wander, sleep, and explore on his own.</li>
              <li>💖 Pet him, tickle his tummy, or give him a high-five!</li>
              <li>🔔 Stays silent during meetings. Catches you up when you're back.</li>
            </ul>
            <button className="onboarding-btn primary" onClick={handleNext}>
              Sounds good →
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="onboarding-step">
            <h1>What's your name?</h1>
            <p>
              Mitra loves greeting his friends by name. 🦊
            </p>
            <input 
              type="text" 
              placeholder="Your name" 
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && userName.trim() && handleComplete()}
              style={{ width: '100%', padding: '10px', margin: '15px 0', borderRadius: '8px', border: 'none', fontSize: '16px' }}
            />
            <p className="highlight-text" style={{ fontSize: '11px', marginTop: '10px', opacity: 0.7 }}>
              You can find Mitra's settings by clicking the <strong>⚙️ gear icon</strong> that appears when you hover over him.
            </p>
            <button className="onboarding-btn success" onClick={handleComplete} disabled={!userName.trim()}>
              Let's go, {userName.trim() || "friend"}! 🎉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
