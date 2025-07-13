use std::env::current_exe;

use ffmpeg_sidecar::{
    command::{ffmpeg_is_installed, FfmpegCommand},
    download::{
        check_latest_version, download_ffmpeg_package, ffmpeg_download_url, unpack_ffmpeg
    },
    paths::sidecar_dir,
    version::ffmpeg_version_with_path,
};

#[tauri::command]
pub fn init() {
    if ffmpeg_is_installed() {
        println!("FFmpeg is already installed and available in PATH.");
        return;
    }

    match check_latest_version() {
        Ok(version) => println!("FFmpeg version: {}", version),
        Err(_) => println!("Skipping FFmpeg version check on this platform"),
    }

    let download_url = ffmpeg_download_url().map_err(|e| e.to_string()).unwrap();
    let cli_arg = std::env::args().nth(1);
    let destination = match cli_arg {
        Some(arg) => resolve_relative_path(
            current_exe()
                .map_err(|e| e.to_string()).unwrap()
                .parent()
                .unwrap()
                .join(arg),
        ),
        None => sidecar_dir().map_err(|e| e.to_string()).unwrap(),
    };

    println!("Downloading from: {:?}", download_url);
    let archive_path = download_ffmpeg_package(download_url, &destination);
    println!("Downloaded package: {:?}", archive_path);

    // Extraction uses `tar` on all platforms (available in Windows since version 1803)
    println!("Extracting...");
    unpack_ffmpeg(&archive_path.unwrap(), &destination).unwrap();

    // Use the freshly installed FFmpeg to check the version number
    let version = ffmpeg_version_with_path(destination.join("ffmpeg"));
    println!("FFmpeg version: {}", version.unwrap_or("unknown".into()));

    println!("Done! 🏁");
}

#[tauri::command]
pub fn remux(input: &str, output: &str) -> Result<(), String> {
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

// #[cfg(feature = "download_ffmpeg")]
fn resolve_relative_path(path_buf: std::path::PathBuf) -> std::path::PathBuf {
    use std::path::{Component, PathBuf};

    let mut components: Vec<PathBuf> = vec![];
    for component in path_buf.as_path().components() {
        match component {
            Component::Prefix(_) | Component::RootDir => {
                components.push(component.as_os_str().into())
            }
            Component::CurDir => (),
            Component::ParentDir => {
                if !components.is_empty() {
                    components.pop();
                }
            }
            Component::Normal(component) => components.push(component.into()),
        }
    }
    PathBuf::from_iter(components)
}
