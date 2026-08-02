#[cfg(target_os = "windows")]
use gsmtc::SessionManager;

#[cfg(target_os = "windows")]
#[tokio::main]
async fn main() {
    let mut manager = SessionManager::create().await.unwrap();
    
    println!("Listening for media updates...");
    
    // Test the first event
    if let Some(event) = manager.recv().await {
        println!("Event: {:?}", event);
    }
}

#[cfg(not(target_os = "windows"))]
fn main() {
    println!("Media session integration is Windows-only.");
}
