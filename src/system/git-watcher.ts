export interface GitWatcher {
  start(): void;
  stop(): void;
}

export function createGitWatcher(onCommit: () => void): GitWatcher {
  let intervalId: any = null;
  let hasStarted = false;
  let lastCommitHash: string | null = null;

  const checkGitLog = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const hash = await invoke<string | null>("get_git_hash");
      if (hash) {
        if (lastCommitHash && hash !== lastCommitHash) {
          onCommit();
        }
        lastCommitHash = hash;
      }
    } catch (e) {
      // API might not be available in production or if Vite server is offline
      // Fallback to the previous mock logic for demonstration purposes
      if (Math.random() < 0.20) {
        // onCommit(); // Uncomment to keep the random mock if real git is unavailable
      }
    }
  };

  return {
    start() {
      if (hasStarted) return;
      hasStarted = true;
      // Check every 10 seconds
      intervalId = setInterval(checkGitLog, 10000);
      // Started monitoring
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
