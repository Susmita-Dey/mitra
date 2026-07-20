//! Companion window placement.
//!
//! Mitra anchors to the bottom-right of the primary monitor so it stays out of
//! the way while remaining visible — a desk companion, not a centered app.

use tauri::{App, Manager, PhysicalPosition, WebviewWindow};

/// Padding from the monitor edge so Mitra does not touch the taskbar bezel.
const EDGE_MARGIN_PX: i32 = 16;

pub fn configure_main_window(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let window = app
        .get_webview_window("main")
        .ok_or("main window not found during setup")?;

    position_bottom_right(&window)?;

    Ok(())
}

fn position_bottom_right(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    let monitor = window
        .primary_monitor()?
        .ok_or("no primary monitor available")?;

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let window_size = window.outer_size()?;

    let x = monitor_pos.x
        + monitor_size.width as i32
        - window_size.width as i32
        - EDGE_MARGIN_PX;
    let y = monitor_pos.y
        + monitor_size.height as i32
        - window_size.height as i32
        - EDGE_MARGIN_PX;

    window.set_position(PhysicalPosition::new(x, y))?;

    Ok(())
}
