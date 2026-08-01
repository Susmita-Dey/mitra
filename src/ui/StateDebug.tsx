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
      // Toggle on Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowPanel(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fireDebugEvent = (type: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent('companion:debug', { detail: { type, payload } }));
  };

  return (
    <span className="state-debug" style={{ pointerEvents: showPanel ? 'auto' : 'none' }}>
      <div className="debug-content" style={{fontSize: '10px', marginTop: '4px'}}>
        <div>Action: {character.animation}</div>
        <div>Int: {character.interaction}</div>
      </div>
      
      {showPanel && (
        <div className="debug-panel" style={{
          marginTop: '8px', 
          background: 'rgba(0,0,0,0.8)', 
          padding: '8px', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          color: 'white'
        }}>
          <div style={{fontWeight: 'bold', marginBottom: '4px'}}>Dev Tools (Ctrl+Shift+D)</div>
          
          <button onClick={() => fireDebugEvent('force-reminder', 'water')}>💧 Force Water</button>
          <button onClick={() => fireDebugEvent('force-reminder', 'stretch')}>🧘 Force Stretch</button>
          <button onClick={() => fireDebugEvent('force-reminder', 'eyes')}>👁️ Force Eyes</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'sleepy')}>😴 Force Sleepy</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'energetic')}>⚡ Force Energetic</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'concerned')}>🥺 Force Concerned</button>
          <button onClick={() => fireDebugEvent('force-emotion', 'happy')}>😊 Force Happy</button>
          <button onClick={() => fireDebugEvent('force-interaction', 'pet')}>👋 Force Pet</button>
          
        </div>
      )}
    </span>
  );
}
