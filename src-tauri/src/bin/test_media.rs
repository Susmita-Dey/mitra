use gsmtc::{SessionManager};

#[tokio::main]
async fn main() {
    let mut manager = SessionManager::create().await.unwrap();
    
    println!("Listening for media updates...");
    
    // Test the first event
    if let Some(event) = manager.recv().await {
        println!("Event: {:?}", event);
    }
}
