use std::path::PathBuf;

use deno_core::{anyhow::bail, error::AnyError, ModuleSpecifier};

pub fn module_specifier_to_path_buf(module_specifier: &ModuleSpecifier) -> PathBuf {
    PathBuf::from(
        module_specifier
            .to_string()
            .replace(module_specifier.scheme(), "")
            .replace("://", ""),
    )
}

pub struct ModuleCache {
    pub cache_location: PathBuf,
}

impl ModuleCache {
    pub fn add(&self, module_specifier: &ModuleSpecifier, code: String) -> Result<(), AnyError> {
        println!("Adding {} to cache", module_specifier);

        let cache_location = self.cache_location.clone();

        let url_path = module_specifier_to_path_buf(module_specifier);
        let cache_path = cache_location.join(url_path);

        let parent = cache_path
            .parent()
            .expect("Failed getting a cache_path parent");

        if !parent.exists() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::write(cache_path, code)?;

        Ok(())
    }

    pub fn get(&self, module_specifier: &ModuleSpecifier) -> Result<String, AnyError> {
        let url_path = module_specifier_to_path_buf(module_specifier);
        let cache_path = self.cache_location.join(url_path);

        if !cache_path.exists() {
            bail!(
                "Couldn't find module {}\nin cache\nat {}",
                module_specifier,
                cache_path.display()
            );
        }

        let code = std::fs::read_to_string(cache_path)?;
        Ok(code)
    }

    pub fn clear(&self) -> Result<(), AnyError> {
        let cache_path = self.cache_location.clone();

        if !cache_path.exists() {
            return Ok(());
        }

        std::fs::remove_dir_all(cache_path)?;
        Ok(())
    }
}
