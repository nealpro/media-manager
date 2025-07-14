use ffmpeg_sidecar::command::FfmpegCommand;
use tauri::{AppHandle, Manager, Runtime};

// Helper function to generate output filename
fn generate_output_filename(original_name: &str, operation: &str, format: &str) -> String {
    let base_name = if let Some(dot_pos) = original_name.rfind('.') {
        &original_name[..dot_pos]
    } else {
        original_name
    };

    match operation {
        "convert" => format!("{}_converted.{}", base_name, format),
        "trim" => format!(
            "{}_trimmed.{}",
            base_name,
            original_name.split('.').last().unwrap_or("mp4")
        ),
        _ => format!(
            "{}_processed.{}",
            base_name,
            original_name.split('.').last().unwrap_or("mp4")
        ),
    }
}

// File handling commands
#[tauri::command]
pub fn write_temp_file<R: Runtime>(
    app_handle: AppHandle<R>,
    file_data: Vec<u8>,
    original_name: String,
) -> Result<String, String> {
    // Use Tauri's app_data_dir for better OS-managed temporary file handling
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let tmp_dir = app_data_dir.join("tmp");

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
pub fn generate_temp_output_path<R: Runtime>(
    app_handle: AppHandle<R>,
    original_name: String,
    operation: String,
    format: String,
) -> Result<String, String> {
    // Use Tauri's app_data_dir for better OS-managed temporary file handling
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let tmp_dir = app_data_dir.join("tmp");

    // Generate unique filename to avoid conflicts
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let output_name = generate_output_filename(&original_name, &operation, &format);
    let temp_output_filename = format!("{}_{}", timestamp, output_name);
    let temp_output_path = tmp_dir.join(&temp_output_filename);

    Ok(temp_output_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn move_processed_file(temp_path: String, final_path: String) -> Result<(), String> {
    std::fs::rename(&temp_path, &final_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cleanup_temp_files<R: Runtime>(app_handle: AppHandle<R>) -> Result<(), String> {
    // Use Tauri's app_data_dir for cleanup
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let tmp_dir = app_data_dir.join("tmp");

    if tmp_dir.exists() {
        let entries = std::fs::read_dir(&tmp_dir).map_err(|e| e.to_string())?;
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
    let mut child = FfmpegCommand::new()
        .arg("-i")
        .arg(input)
        .arg("-c")
        .arg("copy")
        .arg(output)
        .spawn()
        .map_err(|e| e.to_string())?;

    // Capture stderr before waiting
    let stderr = child.take_stderr().unwrap();

    // Read stderr in a separate thread to avoid blocking
    use std::io::Read;
    use std::thread;
    let stderr_handle = thread::spawn(move || {
        let mut content = String::new();
        let _ = std::io::BufReader::new(stderr).read_to_string(&mut content);
        content
    });

    // Wait for the process to complete
    let exit_status = child.wait().map_err(|e| e.to_string())?;

    // Get stderr content
    let stderr_content = stderr_handle.join().unwrap_or_default();

    if !exit_status.success() {
        return Err(format!("FFmpeg failed: {}", stderr_content));
    }

    Ok(output.to_string())
}

#[tauri::command]
pub fn transcode(input: &str, output: &str, out_encoding: &str) -> Result<String, String> {
    println!("Transcode called with input: {}, output: {}, encoding: {}", input, output, out_encoding);
    
    // Check if the output format is audio-only based on the extension
    let is_audio_only = output.to_lowercase().ends_with(".mp3")
        || output.to_lowercase().ends_with(".wav")
        || output.to_lowercase().ends_with(".m4a")
        || output.to_lowercase().ends_with(".aac")
        || output.to_lowercase().ends_with(".flac")
        || output.to_lowercase().ends_with(".ogg")
        || output.to_lowercase().ends_with(".opus");

    println!("Is audio only: {}", is_audio_only);

    let mut command = FfmpegCommand::new();
    command.arg("-i").arg(input);

    // Only add video codec arguments if not audio-only
    if !is_audio_only {
        command.args(&["-c:v", "libx264", "-preset", "fast", "-crf", "22"]);
    }

    // Map format to appropriate audio codec
    let audio_codec = match out_encoding {
        "mp3" => "libmp3lame",
        "wav" => "pcm_s16le",
        "m4a" => "aac",
        "aac" => "aac",
        "flac" => "flac",
        "ogg" => "libvorbis",
        "opus" => "libopus",
        _ => "aac", // Default fallback
    };

    // Add audio codec arguments
    command.arg("-c:a").arg(audio_codec);

    println!("Using audio codec: {}", audio_codec);
    println!("FFmpeg command: {:?}", command);

    // Add output
    command.arg(output);

    let mut child = command.spawn().map_err(|e| {
        let error_msg = format!("Failed to spawn FFmpeg process: {}", e);
        println!("Error: {}", error_msg);
        error_msg
    })?;

    // Capture stderr before waiting
    let stderr = child.take_stderr().unwrap();

    // Read stderr in a separate thread to avoid blocking
    use std::io::Read;
    use std::thread;
    let stderr_handle = thread::spawn(move || {
        let mut content = String::new();
        let _ = std::io::BufReader::new(stderr).read_to_string(&mut content);
        content
    });

    // Wait for the process to complete
    let exit_status = child.wait().map_err(|e| {
        let error_msg = format!("Failed to wait for FFmpeg process: {}", e);
        println!("Error: {}", error_msg);
        error_msg
    })?;

    // Get stderr content
    let stderr_content = stderr_handle.join().unwrap_or_default();

    println!("FFmpeg exit status: {:?}", exit_status);
    println!("FFmpeg stderr: {}", stderr_content);

    if !exit_status.success() {
        let error_msg = format!("FFmpeg failed with exit code {:?}: {}", exit_status.code(), stderr_content);
        println!("Error: {}", error_msg);
        return Err(error_msg);
    }

    println!("Transcode completed successfully: {}", output);
    Ok(output.to_string())
}

// ffmpeg -ss HH:MM:SS -i input.mp4 -to HH:MM:SS -c:v copy -c:a copy output.mp4
#[tauri::command]
pub fn trim(input: &str, output: &str, start: &str, end: &str) -> Result<String, String> {
    println!("Trim called with input: {}, output: {}, start: {}, end: {}", input, output, start, end);
    
    let mut child = FfmpegCommand::new()
        .arg("-ss")
        .arg(start)
        .arg("-i")
        .arg(input)
        .arg("-to")
        .arg(end)
        .args(&["-c:v", "copy", "-c:a", "copy"])
        .arg(output)
        .spawn()
        .map_err(|e| {
            let error_msg = format!("Failed to spawn FFmpeg process: {}", e);
            println!("Error: {}", error_msg);
            error_msg
        })?;

    // Capture stderr before waiting
    let stderr = child.take_stderr().unwrap();

    // Read stderr in a separate thread to avoid blocking
    use std::io::Read;
    use std::thread;
    let stderr_handle = thread::spawn(move || {
        let mut content = String::new();
        let _ = std::io::BufReader::new(stderr).read_to_string(&mut content);
        content
    });

    // Wait for the process to complete
    let exit_status = child.wait().map_err(|e| e.to_string())?;

    // Get stderr content
    let stderr_content = stderr_handle.join().unwrap_or_default();

    if !exit_status.success() {
        return Err(format!("FFmpeg failed: {}", stderr_content));
    }

    Ok(output.to_string())
}
