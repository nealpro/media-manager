mod initialize;
mod remux_transcode;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Clean up any orphaned temp files from previous sessions
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let _ = remux_transcode::cleanup_temp_files(handle);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // FFmpeg initialization
            initialize::init,
            // File handling
            remux_transcode::write_temp_file,
            remux_transcode::generate_temp_output_path,
            remux_transcode::move_processed_file,
            remux_transcode::cleanup_temp_files,
            // Media processing
            remux_transcode::remux,
            remux_transcode::transcode,
            remux_transcode::trim,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
