import type { Character } from "@/types";
import { useState, useEffect } from "react";
import "./StateDebug.css";

export interface StateDebugProps {
  character: Character;
}

export function StateDebug({ character }: StateDebugProps) {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowPanel(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    import('@tauri-apps/api/window').then(({ getCurrentWindow, LogicalSize }) => {
      const win = getCurrentWindow();
      if (showPanel) {
        win.setSize(new LogicalSize(580, 500)).catch(console.error);
      } else {
        win.setSize(new LogicalSize(350, 500)).catch(console.error);
      }
    }).catch(console.error);
  }, [showPanel]);

  const fireDebugEvent = (type: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent('companion:debug', { detail: { type, payload } }));
  };

  return (
    <span className="state-debug" style={{ pointerEvents: showPanel ? 'auto' : 'none' }}>
      <div className="debug-content" style={{fontSize: '10px', marginTop: '4px'}}>
        <div>Action: {character.animation}</div>
        <div>Int: {character.interaction}</div>
        <div>Mood: {character.emotion}</div>
        {character.physical && (
          <div>
            H: {character.physical.health} B: {character.physical.behavior}
          </div>
        )}
        <div>E: {Math.round(character.energy ?? 0)} A: {Math.round(character.attention ?? 0)}</div>
      </div>

      {showPanel && (
        <div className="debug-panel">
          <div className="debug-panel-header">🛠 Dev Tools</div>

          <div className="debug-section-label">⏰ Reminders</div>
          <button onClick={() => fireDebugEvent('force-reminder', 'water')}>💧 Water</button>
          <button onClick={() => fireDebugEvent('force-reminder', 'stretch')}>🧘 Stretch</button>
          <button onClick={() => fireDebugEvent('force-reminder', 'eyes')}>👁️ Eyes</button>
          <button onClick={() => fireDebugEvent('force-reminder', 'snack')}>🍎 Snack</button>
          <button onClick={() => fireDebugEvent('force-reminder', 'bio')}>🚽 Bio</button>

          <div className="debug-section-label">😊 Emotion</div>
          <button onClick={() => fireDebugEvent('force-emotion', 'happy')}>😊 Happy</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'sleepy')}>😴 Sleepy</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'bored')}>😑 Bored</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'concerned')}>🥺 Concerned</button>

          <div className="debug-section-label">✋ Interaction</div>
          <button onClick={() => fireDebugEvent('force-interaction', 'pet')}>🐾 Pet</button>
          <button onClick={() => fireDebugEvent('force-interaction', 'high-five')}>🙌 High-Five</button>
          <button onClick={() => fireDebugEvent('force-interaction', 'tickle')}>😂 Tickle</button>
          <button onClick={() => fireDebugEvent('force-interaction', 'poke')}>👉 Poke</button>
        </div>
      )}
    </span>
  );
}
