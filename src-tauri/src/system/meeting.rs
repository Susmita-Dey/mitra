use std::sync::Mutex;
use sysinfo::System;

pub struct SystemState(pub Mutex<System>);

#[tauri::command]
pub fn check_meeting_status(state: tauri::State<'_, SystemState>) -> bool {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let meeting_apps = ["Zoom.exe", "Teams.exe", "ms-teams.exe", "Discord.exe", "Webex.exe", "slack.exe"];

    for process in sys.processes().values() {
        let name = process.name();
        for app in meeting_apps.iter() {
            if name.eq_ignore_ascii_case(app) {
                return true;
            }
        }
    }
    
    false
}

#[tauri::command]
pub fn check_coding_status(state: tauri::State<'_, SystemState>) -> bool {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let coding_apps = ["Code.exe", "Cursor.exe", "devenv.exe", "idea64.exe", "webstorm64.exe", "antigravity.exe"];

    for process in sys.processes().values() {
        let name = process.name();
        for app in coding_apps.iter() {
            if name.eq_ignore_ascii_case(app) {
                return true;
            }
        }
    }
    
    false
}
