export interface GitWatcher {
  start(): void;
  stop(): void;
}

export function createGitWatcher(_onCommit: () => void): GitWatcher {
  return {
    start() { console.log('[GitWatcher] Disabled because @tauri-apps/api/fs is missing'); },
    stop() {}
  };
}
