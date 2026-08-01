import { useState } from "react";
import type { AppStorage } from "@/storage/app-storage";
import "./Onboarding.css";

interface OnboardingProps {
  storage: AppStorage;
  onComplete: () => void;
}

export function Onboarding({ storage, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(2);
  const handleComplete = async () => {
    await storage.update({ onboardingComplete: true });
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal glass-panel">
        {step === 1 && (
          <div className="onboarding-step">
            <h1>Meet Mitra! 🐾</h1>
            <p>
              Mitra is your new digital companion. He lives on your desktop, keeping you company while you work.
            </p>
            <ul className="onboarding-features">
              <li>💧 He'll remind you to drink water and stretch.</li>
              <li>🖱️ You can drag him anywhere on your screen.</li>
              <li>💖 Pet him, tickle his tummy, and give him high-fives!</li>
            </ul>
            <button className="onboarding-btn primary" onClick={handleNext}>
              Next
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="onboarding-step">
            <h1>Make Him Yours ⚙️</h1>
            <p>
              Want him to ignore your mouse while you're busy? Or maybe put some sunglasses on him?
            </p>
            <p className="highlight-text">
              <strong>Right-click</strong> on Mitra at any time to open his settings.
            </p>
            <button className="onboarding-btn success" onClick={handleComplete}>
              Let's Go!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
