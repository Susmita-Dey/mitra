use win_gsmtc::{SessionManager, SessionUpdateEvent};

#[tokio::main]
async fn main() {
    let mut manager = SessionManager::create().await.unwrap();
    let mut rx = manager.session_update_receiver();
    
    println!("Listening for media updates...");
    
    // Test the first event
    if let Ok(event) = rx.recv().await {
        println!("Event: {:?}", event);
    }
}
