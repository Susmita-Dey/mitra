//! Screen geometry commands.
//!
//! Returns physical screen dimensions and monitor count.
//! No personal data is collected — only integer pixel counts
//! and the number of connected displays.

// use tauri::Manager;

/// Serialisable screen information returned to the frontend.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenInfo {
    pub width: u32,
    pub height: u32,
    pub device_pixel_ratio: f64,
    pub monitor_count: usize,
}

/// Tauri command — called once on startup by the EnvironmentService.
///
/// Returns geometry for the primary monitor and the total monitor count.
/// Falls back to safe zero values if monitor information is unavailable.
#[tauri::command]
pub fn get_screen_info(window: tauri::WebviewWindow) -> ScreenInfo {
    let monitors: Vec<_> = window.available_monitors().unwrap_or_default();
    let monitor_count = monitors.len();

    // Use primary monitor if available, else first in list, else zero-values.
    let primary = window
        .primary_monitor()
        .ok()
        .flatten()
        .or_else(|| monitors.into_iter().next());

    match primary {
        Some(m) => {
            let size = m.size();
            let scale = m.scale_factor();
            ScreenInfo {
                width: size.width,
                height: size.height,
                device_pixel_ratio: scale,
                monitor_count,
            }
        }
        None => ScreenInfo {
            width: 0,
            height: 0,
            device_pixel_ratio: 1.0,
            monitor_count: 0,
        },
    }
}
