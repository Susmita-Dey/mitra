use std::process::Command;

// Windows: CREATE_NO_WINDOW (0x08000000) prevents the OS from allocating a
// console window for child processes when the parent is a GUI application.
// Without this flag, every `git` invocation flashes a Windows Terminal window.
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

/// The Win32 CREATE_NO_WINDOW process creation flag.
/// Prevents a console window from appearing for CLI child processes.
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
pub fn get_git_hash() -> Option<String> {
    let mut cmd = Command::new("git");
    cmd.args(["rev-parse", "HEAD"]);

    // Suppress console window on Windows. Without this, every invocation
    // creates a visible Windows Terminal flash (flickers in taskbar).
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if hash.is_empty() { None } else { Some(hash) }
            } else {
                None
            }
        }
        Err(_) => None,
    }
}
