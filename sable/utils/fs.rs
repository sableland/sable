use deno_core::anyhow::Error;

use std::hash::{DefaultHasher, Hash, Hasher};
use std::path::{Path, PathBuf};

use tokio::fs;
use tokio::io::AsyncWriteExt;

pub async fn atomic_write(path: &Path, data: impl AsRef<[u8]>) -> Result<(), Error> {
    let temp_file_name = {
        let mut hasher = DefaultHasher::new();
        path.hash(&mut hasher);
        hasher.finish().to_string()
    };
    let temp_path =
        PathBuf::from(shellexpand::full("~/.cache/sable/tmp/")?.into_owned()).join(temp_file_name);

    fs::create_dir_all(
        &temp_path
            .parent()
            .expect("Couldn't find parent of a temp path"),
    )
    .await?;

    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&temp_path)
        .await?;

    file.write_all(data.as_ref()).await?;
    file.sync_all().await?;

    fs::rename(temp_path, path).await?;

    Ok(())
}
