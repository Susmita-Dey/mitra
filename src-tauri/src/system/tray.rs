use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager,
};

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_i = MenuItem::with_id(app, "toggle_visibility", "Hide Mitra", true, None::<&str>)?;
    let compact_i = MenuItem::with_id(app, "toggle_compact", "Compact Mode", true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&toggle_i, &compact_i, &settings_i, &quit_i])?;

    let _tray = TrayIconBuilder::new()
        .tooltip("Mitra")
        // NOTE: Make sure icon.ico is properly configured in tauri.conf.json
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "toggle_visibility" => {
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                    }
                }
            }
            "toggle_compact" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("companion:mode:compact_toggle", ());
                }
            }
            "settings" => {
                // If settings window exists, show it, otherwise spawn it
                if let Some(window) = app.get_webview_window("settings") {
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _ = tauri::WebviewWindowBuilder::new(
                        app,
                        "settings",
                        tauri::WebviewUrl::App("/?page=settings".into()),
                    )
                    .title("Mitra Settings")
                    .inner_size(350.0, 480.0)
                    .build();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
