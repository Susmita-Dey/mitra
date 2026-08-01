mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(system::meeting::SystemState(std::sync::Mutex::new(sysinfo::System::new_all())))
        .invoke_handler(tauri::generate_handler![
            system::screen::get_screen_info,
            system::meeting::check_meeting_status,
            system::meeting::check_coding_status,
            system::git::get_git_hash,
        ])
        .setup(|app| {
            system::window::configure_main_window(app)?;
            system::tray::setup_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
