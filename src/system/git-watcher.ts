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
    } catch {
      // get_git_hash is not available in production installs (no git repo).
      // This catch is intentionally silent — the feature degrades gracefully.
    }
  };

  return {
    start() {
      if (hasStarted) return;

      // Git commit detection only makes sense in a dev environment where the app
      // runs against a local source repo. In a production install there is no
      // .git folder, git spawning is wasteful, and on Windows even a single
      // git process spawn can flash a console window.
      // Completely disabled in production — zero process spawns.
      if (!import.meta.env.DEV) return;

      hasStarted = true;

      // In Tauri production builds the app runs from an install directory with no
      // git repo, so get_git_hash always throws. We run one probe first: if it
      // returns null we are almost certainly in a production install with no git
      // context and we skip the polling loop entirely to avoid spawning `git`
      // (and its MSYS2 subshells) every 10 s.
      (async () => {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const hash = await invoke<string | null>("get_git_hash");
          if (hash === null || hash === undefined) {
            // No git repo at launch — don't start the polling interval.
            hasStarted = false;
            return;
          }
          lastCommitHash = hash;
          // Git repo confirmed: start the interval.
          intervalId = setInterval(checkGitLog, 10_000);
        } catch {
          // Tauri IPC not available or git not installed — skip silently.
          hasStarted = false;
        }
      })();
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      hasStarted = false;
    },
  };
}
