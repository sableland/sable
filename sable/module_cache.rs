use std::path::{Path, PathBuf};

use crate::utils::fs::atomic_write;
use deno_core::anyhow::{bail, Error};
use deno_core::{ModuleSourceCode, ModuleSpecifier};
use tokio::fs;

pub fn module_specifier_to_path_buf(module_specifier: &ModuleSpecifier) -> PathBuf {
    PathBuf::from(
        module_specifier
            .to_string()
            .replace(module_specifier.scheme(), "")
            .replace("://", ""),
    )
}

pub struct ModuleCache {
    location: PathBuf,
}

impl ModuleCache {
    pub fn new(location: PathBuf) -> Self {
        if !location.is_absolute() || location.parent().is_none() {
            panic!("ModuleCache location must be an absolute path with at least one parent")
        }
        Self { location }
    }

    pub fn location(&self) -> &Path {
        &self.location
    }

    pub async fn add(
        &self,
        module_specifier: &ModuleSpecifier,
        source_code: &ModuleSourceCode,
    ) -> Result<(), Error> {
        println!("Adding {} to cache", module_specifier);

        let cache_location = self.location();
        let url_path = module_specifier_to_path_buf(module_specifier);

        let cache_path = cache_location.join(url_path);
        let parent = cache_path.parent().unwrap();

        if !parent.exists() {
            fs::create_dir_all(parent).await?;
        }

        let bytes = match source_code {
            ModuleSourceCode::Bytes(bytes) => bytes.as_bytes(),
            ModuleSourceCode::String(string) => string.as_bytes(),
        };
        atomic_write(&cache_path, bytes, 0o644).await?;

        Ok(())
    }

    pub async fn get(&self, module_specifier: &ModuleSpecifier) -> Result<Box<[u8]>, Error> {
        let url_path = module_specifier_to_path_buf(module_specifier);
        let cache_path = self.location.join(url_path);

        if !cache_path.exists() {
            bail!(
                "Couldn't find module {}\nin cache\nat {}",
                module_specifier,
                cache_path.display()
            );
        }

        let code = fs::read(cache_path).await?;
        Ok(code.into_boxed_slice())
    }

    pub async fn clear(&self) -> Result<(), Error> {
        let cache_path = &self.location;
        println!("Clearing cache at {}", cache_path.display());
        if !cache_path.exists() {
            println!("Cache is already empty");
            return Ok(());
        }

        println!("Removing cache at {}", cache_path.display());
        fs::remove_dir_all(cache_path).await?;

        Ok(())
    }
}
