use deno_core::anyhow::Error;

use std::path::{Path, PathBuf};

use tokio::fs;
use tokio::io::AsyncWriteExt;

pub async fn atomic_write(path: &Path, data: impl AsRef<[u8]>, mode: u32) -> Result<(), Error> {
    let temp_path = PathBuf::from(shellexpand::full("~/.cache/sable/tmp")?.into_owned());
    let file_path = temp_path.join(path);

    // Make sure parent of the file exists
    let parent = file_path.parent().unwrap();
    if let Ok(false) | Err(_) = parent.try_exists() {
        fs::create_dir_all(&parent).await?;
    }

    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(mode)
        .open(&file_path)
        .await?;

    file.write_all(data.as_ref()).await?;
    file.sync_all().await?;

    match fs::rename(&file_path, path).await {
        // If rename fails, it might be because its on a different mount point
        // Try to copy it there instead
        Err(_) => {
            fs::copy(&file_path, path).await?;
            fs::remove_file(&file_path).await?;
        }
        _ => {}
    }

    Ok(())
}
