/** Native window geometry and placement. Implementation lives in Tauri (Rust). */
export interface WindowSystem {
  getBounds(): Promise<{ x: number; y: number; width: number; height: number }>;
  setPosition(x: number, y: number): Promise<void>;
}
