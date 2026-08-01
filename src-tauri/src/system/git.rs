use std::process::Command;

#[tauri::command]
pub fn get_git_hash() -> Option<String> {
    // Run `git rev-parse HEAD` securely using Rust's std::process::Command
    match Command::new("git").args(["rev-parse", "HEAD"]).output() {
        Ok(output) => {
            if output.status.success() {
                let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if hash.is_empty() {
                    None
                } else {
                    Some(hash)
                }
            } else {
                None
            }
        }
        Err(_) => None,
    }
}
