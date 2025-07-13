use std::env::current_exe;

use ffmpeg_sidecar::{
    command::ffmpeg_is_installed,
    download::{check_latest_version, download_ffmpeg_package, ffmpeg_download_url, unpack_ffmpeg},
    paths::sidecar_dir,
    version::ffmpeg_version_with_path,
};

pub fn init() {
    println!("Starting FFmpeg initialization...");

    if ffmpeg_is_installed() {
        println!("FFmpeg is already installed and available in PATH.");
        return;
    }

    println!("FFmpeg not found in PATH, proceeding with download...");

    match check_latest_version() {
        Ok(version) => println!("Latest FFmpeg version available: {}", version),
        Err(e) => {
            println!("Failed to check latest version: {}", e);
            println!("Continuing with download anyway...");
        }
    }

    let download_url = match ffmpeg_download_url() {
        Ok(url) => {
            println!("Download URL determined: {:?}", url);
            url
        }
        Err(e) => {
            println!("ERROR: Failed to get download URL: {}", e);
            return;
        }
    };

    let cli_arg = std::env::args().nth(1);
    println!("CLI argument: {:?}", cli_arg);

    let destination = match cli_arg {
        Some(arg) => {
            println!("Using CLI argument for destination: {}", arg);
            let exe_path = match current_exe() {
                Ok(path) => {
                    println!("Current executable path: {:?}", path);
                    path
                }
                Err(e) => {
                    println!("ERROR: Failed to get current executable path: {}", e);
                    return;
                }
            };

            let parent_dir = match exe_path.parent() {
                Some(dir) => {
                    println!("Executable parent directory: {:?}", dir);
                    dir
                }
                None => {
                    println!("ERROR: Failed to get parent directory of executable");
                    return;
                }
            };

            let joined_path = parent_dir.join(arg);
            println!("Joined path before resolution: {:?}", joined_path);

            let resolved = resolve_relative_path(joined_path);
            println!("Resolved destination path: {:?}", resolved);
            resolved
        }
        None => {
            println!("No CLI argument provided, using default sidecar directory");
            match sidecar_dir() {
                Ok(dir) => {
                    println!("Sidecar directory: {:?}", dir);
                    dir
                }
                Err(e) => {
                    println!("ERROR: Failed to get sidecar directory: {}", e);
                    return;
                }
            }
        }
    };

    // Check if destination directory exists, create if needed
    if !destination.exists() {
        println!(
            "Destination directory doesn't exist, creating: {:?}",
            destination
        );
        if let Err(e) = std::fs::create_dir_all(&destination) {
            println!("ERROR: Failed to create destination directory: {}", e);
            return;
        }
    } else {
        println!("Destination directory exists: {:?}", destination);
    }

    // Check write permissions
    println!("Checking write permissions for destination...");
    let test_file = destination.join("test_write_permission");
    match std::fs::File::create(&test_file) {
        Ok(_) => {
            println!("Write permissions OK");
            let _ = std::fs::remove_file(&test_file);
        }
        Err(e) => {
            println!("ERROR: No write permissions for destination: {}", e);
            return;
        }
    }

    println!("Starting download from: {:?}", download_url);
    println!("Download destination: {:?}", destination);

    let archive_path = match download_ffmpeg_package(download_url, &destination) {
        Ok(path) => {
            println!("Successfully downloaded package to: {:?}", path);
            path
        }
        Err(e) => {
            println!("ERROR: Failed to download FFmpeg package: {}", e);
            return;
        }
    };

    // Verify archive file exists and get its size
    match std::fs::metadata(&archive_path) {
        Ok(metadata) => {
            println!("Archive file size: {} bytes", metadata.len());
            if metadata.len() == 0 {
                println!("ERROR: Downloaded archive is empty!");
                return;
            }
        }
        Err(e) => {
            println!("ERROR: Cannot access downloaded archive: {}", e);
            return;
        }
    }

    // Extraction uses `tar` on all platforms (available in Windows since version 1803)
    println!("Starting extraction of: {:?}", archive_path);
    println!("Extracting to: {:?}", destination);

    match unpack_ffmpeg(&archive_path, &destination) {
        Ok(_) => {
            println!("Successfully extracted FFmpeg package");
        }
        Err(e) => {
            println!("ERROR: Failed to extract FFmpeg package: {}", e);
            return;
        }
    }

    // List contents of destination directory after extraction
    println!("Contents of destination directory after extraction:");
    match std::fs::read_dir(&destination) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    println!("  - {:?}", entry.path());
                }
            }
        }
        Err(e) => {
            println!("ERROR: Cannot read destination directory: {}", e);
        }
    }

    // Use the freshly installed FFmpeg to check the version number
    let ffmpeg_path = destination.join("ffmpeg");
    println!("Checking FFmpeg version at: {:?}", ffmpeg_path);

    // Check if ffmpeg executable exists
    if !ffmpeg_path.exists() {
        println!(
            "ERROR: FFmpeg executable not found at expected location: {:?}",
            ffmpeg_path
        );

        // Try to find ffmpeg in subdirectories
        println!("Searching for ffmpeg in subdirectories...");
        if let Ok(entries) = std::fs::read_dir(&destination) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_dir() {
                        let potential_ffmpeg = path.join("ffmpeg");
                        if potential_ffmpeg.exists() {
                            println!("Found ffmpeg at: {:?}", potential_ffmpeg);
                        }
                    }
                }
            }
        }
        return;
    }

    match ffmpeg_version_with_path(&ffmpeg_path) {
        Ok(version) => {
            println!("FFmpeg version successfully verified: {}", version);
        }
        Err(e) => {
            println!("ERROR: Failed to get FFmpeg version: {}", e);
            println!("This might indicate the binary is corrupted or incompatible");
        }
    }

    println!("Done! 🏁");
}

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
