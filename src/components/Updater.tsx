import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { listen } from "@tauri-apps/api/event";
import "./Updater.css";

export function Updater() {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdate = async (manual = false) => {
    if (manual) {
      setIsChecking(true);
      setMessage("Checking for updates...");
      setError(null);
      setUpdateAvailable(null);
    }
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(update);
        setMessage(null);
      } else if (manual) {
        setMessage("You are on the latest version! 🎉");
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      console.error("Failed to check for updates:", err);
      if (manual) {
        setError("Failed to check for updates. Are you offline?");
        setMessage(null);
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      if (manual) setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial silent check
    setTimeout(() => checkForUpdate(false), 5000);

    const unlisten = listen("companion:window:check_updates", () => {
      checkForUpdate(true);
    });

    return () => {
      unlisten.then((f: any) => f());
    };
  }, []);

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    setIsUpdating(true);
    setError(null);
    try {
      await updateAvailable.downloadAndInstall();
      await relaunch();
    } catch (err: any) {
      console.error("Update failed:", err);
      setError("Failed to install update. Please try again.");
      setIsUpdating(false);
    }
  };

  if (!updateAvailable && !isChecking && !message && !error) return null;

  return (
    <div className="updater-toast">
      <div className="updater-content">
        {updateAvailable ? (
          <>
            <h4>🎁 Update Available: {updateAvailable.version}</h4>
            {error && <p className="updater-error">{error}</p>}
            {!isUpdating ? (
              <div className="updater-actions">
                <button className="updater-btn-primary" onClick={handleUpdate}>Install & Restart</button>
                <button className="updater-btn-secondary" onClick={() => {
                  setUpdateAvailable(null);
                  setError(null);
                }}>Dismiss</button>
              </div>
            ) : (
              <p className="updater-loading">Downloading & Installing...</p>
            )}
          </>
        ) : (
          <>
            {isChecking && <p className="updater-loading">Checking for updates...</p>}
            {message && <p className="updater-message">{message}</p>}
            {error && (
              <>
                <p className="updater-error">{error}</p>
                <button className="updater-btn-secondary" onClick={() => setError(null)} style={{ marginTop: '10px' }}>Dismiss</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
