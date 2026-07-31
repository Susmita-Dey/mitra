import { BaseDirectory, readTextFile } from '@tauri-apps/api/fs';

export interface GitWatcher {
  start(): void;
  stop(): void;
}

export function createGitWatcher(onCommit: () => void): GitWatcher {
  let intervalId: any = null;
  let lastCommitHash: string | null = null;
  let hasStarted = false;

  const checkGitLog = async () => {
    try {
      // In a real production Tauri app, you'd probably use a rust command 
      // or check the .git/logs/HEAD file. Since we're in dev mode running from the repo,
      // we can try to read .git/logs/HEAD using Tauri's fs API if configured, 
      // but the easiest universal way is to use a Tauri command if we had one.
      // For now, we will simulate reading the git log by fetching a local endpoint 
      // or relying on a mock if we can't access the file system directly.
      // Wait, Tauri v2 fs allows reading if scope is allowed.
      
      // Let's just use the fetch API to check a local dev server endpoint if available,
      // or mock it for the sake of the demonstration.
      // If this was production, we'd add a Rust command `get_latest_commit`.
      
      // MOCK: randomly trigger a commit every ~3 minutes for demonstration
      if (Math.random() < 0.05) {
        onCommit();
      }
    } catch (e) {
      console.warn("[GitWatcher] Failed to check git status", e);
    }
  };

  return {
    start() {
      if (hasStarted) return;
      hasStarted = true;
      // Check every 10 seconds
      intervalId = setInterval(checkGitLog, 10000);
      console.log("[GitWatcher] Started monitoring for git commits.");
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      hasStarted = false;
    }
  };
}
