// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Simple test command - call from React to verify communication works
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Tauri backend is working.", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
