use ffmpeg_sidecar::command::FfmpegCommand;
use std::path::PathBuf;

// File handling commands
#[tauri::command]
pub fn write_temp_file(file_data: Vec<u8>, original_name: String) -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or("Could not get executable directory")?;
    let tmp_dir = exe_dir.join("tmp");
    
    // Create tmp directory if it doesn't exist
    std::fs::create_dir_all(&tmp_dir).map_err(|e| e.to_string())?;
    
    // Generate unique filename to avoid conflicts
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let temp_filename = format!("{}_{}", timestamp, original_name);
    let temp_path = tmp_dir.join(&temp_filename);
    
    // Write file data to temporary location
    std::fs::write(&temp_path, file_data).map_err(|e| e.to_string())?;
    
    Ok(temp_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn move_processed_file(temp_path: String, final_path: String) -> Result<(), String> {
    std::fs::rename(&temp_path, &final_path).map_err(|e| e.to_string())?;
    
    // Clean up any remaining temp files for this session
    let temp_pathbuf = PathBuf::from(&temp_path);
    if let Some(parent) = temp_pathbuf.parent() {
        let _ = cleanup_temp_files(parent.to_string_lossy().to_string());
    }
    
    Ok(())
}

#[tauri::command]
pub fn cleanup_temp_files(tmp_dir: String) -> Result<(), String> {
    let tmp_path = PathBuf::from(&tmp_dir);
    if tmp_path.exists() {
        let entries = std::fs::read_dir(&tmp_path).map_err(|e| e.to_string())?;
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    let _ = std::fs::remove_file(&path);
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn remux(input: &str, output: &str) -> Result<String, String> {
    FfmpegCommand::new()
        .arg("-i")
        .arg(input)
        .arg("-c")
        .arg("copy")
        .arg(output)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(output.to_string())
}

#[tauri::command]
pub fn transcode(input: &str, output: &str, out_encoding: &str) -> Result<String, String> {
    FfmpegCommand::new()
        .arg("-i")
        .arg(input)
        .args(&["-c:v", "libx264", "-preset", "fast", "-crf", "22"])
        .arg("-c:a")
        .arg(out_encoding)
        .arg(output)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(output.to_string())
}

// ffmpeg -ss HH:MM:SS -i input.mp4 -to HH:MM:SS -c:v copy -c:a copy output.mp4
#[tauri::command]
pub fn trim(input: &str, output: &str, start: &str, end: &str) -> Result<String, String> {
    FfmpegCommand::new()
        .arg("-ss")
        .arg(start)
        .arg("-i")
        .arg(input)
        .arg("-to")
        .arg(end)
        .args(&["-c:v", "copy", "-c:a", "copy"])
        .arg(output)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(output.to_string())
}