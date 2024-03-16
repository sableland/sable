use deno_core::anyhow::Error;

use std::path::{Path, PathBuf};

use tokio::fs;
use tokio::io::AsyncWriteExt;

pub async fn atomic_write(path: impl AsRef<Path>, data: impl AsRef<[u8]>) -> Result<(), Error> {
    let temp_path = PathBuf::from(shellexpand::full("~/.cache/sable/temp")?.into_owned());

    if temp_path.try_exists().is_err() {
        fs::create_dir_all(temp_path.parent().unwrap()).await?;
    }

    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&temp_path)
        .await?;

    file.write_all(data.as_ref()).await?;
    file.sync_all().await?;

    fs::rename(&temp_path, path).await?;

    Ok(())
}
