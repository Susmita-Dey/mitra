mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(system::meeting::SystemState(std::sync::Mutex::new(sysinfo::System::new_all())))
        .invoke_handler(tauri::generate_handler![
            system::screen::get_screen_info,
            system::meeting::check_meeting_status,
        ])
        .setup(|app| {
            system::window::configure_main_window(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
