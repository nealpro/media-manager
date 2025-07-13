use ffmpeg_sidecar::{
    command::{ffmpeg_is_installed, FfmpegCommand},
    download::auto_download,
    download::UNPACK_DIRNAME,
};

#[tauri::command]
pub fn init() {
    auto_download().unwrap();
    println!(
        "If FFmpeg binary was not in PATH, it has been downloaded and initialized at {}",
        UNPACK_DIRNAME
    );
}

#[tauri::command]
pub fn remux(input: &str, output: &str) -> Result<(), String> {
    if !ffmpeg_is_installed() {
        init();
        println!("FFmpeg was not installed, now it should be.")
        // return Err("FFmpeg is not installed".into());
    }
    FfmpegCommand::new()
        .arg("-i")
        .arg(input)
        .arg("-c")
        .arg("copy")
        .arg(output)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn transcode(input: &str, output: &str, out_encoding: &str) -> Result<(), String> {
    if !ffmpeg_is_installed() {
        init();
        println!("FFmpeg was not installed, now it should be.")
        // return Err("FFmpeg is not installed".into());
    }
    FfmpegCommand::new()
        .arg("-i")
        .arg(input)
        .args(&["-c:v", "libx264", "-preset", "fast", "-crf", "22"]) // Example encoding options
        // .arg("-vf")
        // .arg("transpose=1")
        // .arg("-c:v")
        .arg(out_encoding)
        .arg(output)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ffmpeg -ss HH:MM:SS -i input.mp4 -to HH:MM:SS -c:v copy -c:a copy output.mp4
#[tauri::command]
pub fn trim(input: &str, output: &str, start: &str, end: &str) -> Result<(), String> {
    if !ffmpeg_is_installed() {
        init();
        println!("FFmpeg was not installed, now it should be.")
        // return Err("FFmpeg is not installed".into());
    }
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
    Ok(())
}
