use std::sync::Mutex;
use std::time::{Duration, Instant};
use sysinfo::{ProcessesToUpdate, System};

/// Cached system state with throttled refresh.
/// `sysinfo::refresh_processes` is expensive — we only refresh at most once per 30 seconds.
pub struct SystemState(pub Mutex<(System, Instant)>);

impl SystemState {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_processes(ProcessesToUpdate::All, true);
        SystemState(Mutex::new((sys, Instant::now())))
    }
}

const REFRESH_INTERVAL: Duration = Duration::from_secs(30);

fn refresh_if_stale(state: &tauri::State<'_, SystemState>) -> std::sync::MutexGuard<'_, (System, Instant)> {
    let mut guard = state.0.lock().unwrap();
    if guard.1.elapsed() >= REFRESH_INTERVAL {
        guard.0.refresh_processes(ProcessesToUpdate::All, true);
        guard.1 = Instant::now();
    }
    guard
}

#[tauri::command]
pub fn check_meeting_status(state: tauri::State<'_, SystemState>) -> bool {
    let guard = refresh_if_stale(&state);
    let meeting_apps = [
        "zoom.exe", "teams.exe", "ms-teams.exe", "discord.exe",
        "webex.exe", "slack.exe", "skype.exe", "meet.exe",
    ];
    guard.0.processes().values().any(|p| {
        let name = p.name().to_string_lossy().to_lowercase();
        meeting_apps.iter().any(|&app| name == app)
    })
}

#[tauri::command]
pub fn check_coding_status(state: tauri::State<'_, SystemState>) -> bool {
    let guard = refresh_if_stale(&state);
    let coding_apps = [
        "code.exe", "cursor.exe", "devenv.exe", "idea64.exe",
        "webstorm64.exe", "rider64.exe", "clion64.exe", "goland64.exe",
        "pycharm64.exe", "fleet.exe",
    ];
    guard.0.processes().values().any(|p| {
        let name = p.name().to_string_lossy().to_lowercase();
        coding_apps.iter().any(|&app| name == app)
    })
}
