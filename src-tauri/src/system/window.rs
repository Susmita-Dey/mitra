//! Companion window placement.
//!
//! Window positioning is handled entirely by the JS WindowController.restorePosition()
//! which reads the saved position from storage and falls back to the bottom-right of
//! the primary monitor. The Rust side only ensures the window handle is created —
//! it must not set a position that JS will immediately overwrite (causing a flash).

use tauri::{App, Manager};

/// Ensure the main window is ready. Positioning is delegated to JS.
pub fn configure_main_window(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let _window = app
        .get_webview_window("main")
        .ok_or("main window not found during setup")?;

    // Intentionally no position call here.
    // JS WindowController.restorePosition() runs on startup and is the
    // single authoritative source for window placement.

    Ok(())
}
