use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager,
};

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_i = MenuItem::with_id(app, "toggle_visibility", "Hide Mitra", true, None::<&str>)?;
    let updates_i = MenuItem::with_id(app, "check_updates", "Check for Updates", true, None::<&str>)?;
    let tasks_i = MenuItem::with_id(app, "tasks", "Open Tasks", true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&toggle_i, &tasks_i, &settings_i, &updates_i, &quit_i])?;

    let _tray = TrayIconBuilder::with_id("main")
        .tooltip("Mitra")
        // NOTE: Make sure icon.ico is properly configured in tauri.conf.json
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "toggle_visibility" => {
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                        let _ = window.emit("companion:window:hidden", ());
                        if let Some(item) = menu.get("toggle_visibility") {
                            if let Some(menu_item) = item.as_menuitem() {
                                let _ = menu_item.set_text("Show Mitra");
                            }
                        }
                    } else {
                        let _ = window.show();
                        let _ = window.emit("companion:window:shown", ());
                        if let Some(item) = menu.get("toggle_visibility") {
                            if let Some(menu_item) = item.as_menuitem() {
                                let _ = menu_item.set_text("Hide Mitra");
                            }
                        }
                    }
                }
            }
            "check_updates" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("companion:window:check_updates", ());
                    let _ = window.show();
                    let _ = window.set_focus();
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
            "tasks" => {
                if let Some(window) = app.get_webview_window("tasks") {
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _ = tauri::WebviewWindowBuilder::new(
                        app,
                        "tasks",
                        tauri::WebviewUrl::App("/?page=tasks".into()),
                    )
                    .title("Tasks & Goals")
                    .inner_size(380.0, 550.0)
                    .transparent(true)
                    .decorations(false)
                    .always_on_top(true)
                    .shadow(true)
                    .build();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
