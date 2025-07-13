// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // FFmpeg initialization before running the app
    reveal_media_manager_lib::initialize::init();
    // Run the Tauri application
    reveal_media_manager_lib::run();
}
