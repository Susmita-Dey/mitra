use serde::Serialize;
use tauri::{AppHandle, Emitter};
use win_gsmtc::{SessionManager, SessionUpdateEvent};

#[derive(Clone, Serialize)]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub is_playing: bool,
    pub source: String,
}

pub fn start_media_listener(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Attempt to create the GSMTC SessionManager
        let manager_res = SessionManager::create().await;
        
        match manager_res {
            Ok(mut manager) => {
                let mut rx = manager.session_update_receiver();
                
                while let Ok(event) = rx.recv().await {
                    match event {
                        SessionUpdateEvent::Model(model) => {
                            let state = MediaState {
                                title: model.media_info.title.clone(),
                                artist: model.media_info.artist.clone(),
                                is_playing: model.playback_info.is_playing(),
                                source: model.source.clone(),
                            };
                            
                            // Emit the event to the frontend
                            let _ = app_handle.emit("media-session-update", state);
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to initialize GSMTC: {:?}", e);
            }
        }
    });
}
