import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./ContextMenu.css";

export interface ContextMenuProps {
  x: number;
  y: number;
  isMuted: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export function ContextMenu({ x, y, isMuted, onClose, onToggleMute, onOpenSettings }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close if clicked outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Slight delay to prevent the context menu opening click from immediately closing it
    const timer = setTimeout(() => {
      window.addEventListener("click", handleClick);
    }, 10);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  const handleExit = () => {
    getCurrentWindow().close();
  };

  return (
    <div 
      className="mitra-context-menu" 
      ref={menuRef}
      style={{ left: x, top: y }}
    >
      <div className="menu-header">Mitra Options</div>
      
      <button className="menu-item" onClick={() => { onToggleMute(); onClose(); }}>
        <span className="icon">{isMuted ? "🔇" : "🔊"}</span>
        {isMuted ? "Unmute Sounds" : "Mute Sounds"}
      </button>

      <button className="menu-item" onClick={() => { onOpenSettings(); onClose(); }}>
        <span className="icon">⚙️</span>
        Settings
      </button>
      
      <div className="menu-divider" />
      
      <button className="menu-item danger" onClick={handleExit}>
        <span className="icon">✖</span>
        Say Goodbye
      </button>
    </div>
  );
}
