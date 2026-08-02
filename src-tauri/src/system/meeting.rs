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

fn refresh_if_stale<'a>(state: &'a tauri::State<'a, SystemState>) -> std::sync::MutexGuard<'a, (System, Instant)> {
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
        "zoom", "teams", "ms-teams", "discord",
        "webex", "slack", "skype", "meet",
    ];
    guard.0.processes().values().any(|p| {
        let name = p.name().to_string_lossy().to_lowercase();
        let base_name = name.strip_suffix(".exe").unwrap_or(&name);
        meeting_apps.iter().any(|&app| base_name == app)
    })
}

#[tauri::command]
pub fn check_coding_status(state: tauri::State<'_, SystemState>) -> bool {
    let guard = refresh_if_stale(&state);
    let coding_apps = [
        "code", "cursor", "devenv", "idea", "idea64",
        "webstorm", "webstorm64", "rider", "rider64", "clion", "clion64",
        "goland", "goland64", "pycharm", "pycharm64", "fleet",
    ];
    guard.0.processes().values().any(|p| {
        let name = p.name().to_string_lossy().to_lowercase();
        let base_name = name.strip_suffix(".exe").unwrap_or(&name);
        coding_apps.iter().any(|&app| base_name == app)
    })
}
