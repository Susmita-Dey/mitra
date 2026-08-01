use tauri::AppHandle;

/// Starts the platform-specific media session listener.
/// On Windows: uses the Global System Media Transport Controls (GSMTC) via win-gsmtc.
/// On other platforms: no-op — media reactions are not yet supported.
pub fn start_media_listener(app_handle: AppHandle) {
    #[cfg(target_os = "windows")]
    start_windows_media_listener(app_handle);

    #[cfg(not(target_os = "windows"))]
    {
        let _ = app_handle; // suppress unused warning
        // Media session integration is Windows-only in v0.2.
        // macOS / Linux support via MPRIS or MediaRemote is planned for v0.3.
    }
}

#[cfg(target_os = "windows")]
fn start_windows_media_listener(app_handle: AppHandle) {
    use serde::Serialize;
    use tauri::Emitter;
    use gsmtc::{SessionManager, SessionUpdateEvent};

    #[derive(Clone, Serialize)]
    struct MediaState {
        title: String,
        artist: String,
        is_playing: bool,
        source: String,
    }

    tauri::async_runtime::spawn(async move {
        let manager_res = SessionManager::create().await;

        match manager_res {
            Ok(mut manager) => {
                while let Some(evt) = manager.recv().await {
                    if let gsmtc::ManagerEvent::SessionCreated { mut rx, .. } = evt {
                        let app_handle = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            while let Some(session_evt) = rx.recv().await {
                                if let SessionUpdateEvent::Model(model) = session_evt {
                                    let state = MediaState {
                                        title: model.media.as_ref().map(|m| m.title.clone()).unwrap_or_default(),
                                        artist: model.media.as_ref().map(|m| m.artist.clone()).unwrap_or_default(),
                                        is_playing: model.playback.as_ref().map(|p| p.status == gsmtc::PlaybackStatus::Playing).unwrap_or(false),
                                        source: model.source.clone(),
                                    };
                                    let _ = app_handle.emit("media-session-update", state);
                                }
                            }
                        });
                    }
                }
            }
            Err(e) => {
                // Non-fatal: media reactions simply won't work.
                // This can happen if the user's Windows version doesn't support GSMTC.
                eprintln!("[Mitra] Media session unavailable: {:?}", e);
            }
        }
    });
}
