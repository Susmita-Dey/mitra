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
      // In development mode, we fetch from the local Vite dev server API
      // In production, you would use Tauri's Rust command to read the git log
      const res = await fetch('/api/git-hash');
      if (res.ok) {
        const data = await res.json();
        if (data.hash) {
          if (lastCommitHash && data.hash !== lastCommitHash) {
            onCommit();
          }
          lastCommitHash = data.hash;
        }
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
      console.log("[GitWatcher] Started monitoring real git commits.");
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
