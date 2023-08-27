use std::sync::Arc;

use deno_ast::{MediaType, ParseParams, SourceTextInfo};
use deno_core::{anyhow::bail, futures::FutureExt, ModuleSpecifier};

use crate::{module_cache::ModuleCache, BuenoOptions};

pub struct BuenoModuleLoader {
    pub module_cache: Arc<ModuleCache>,
    pub options: BuenoOptions,
}

impl deno_core::ModuleLoader for BuenoModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: deno_core::ResolutionKind,
    ) -> Result<ModuleSpecifier, deno_core::error::AnyError> {
        deno_core::resolve_import(specifier, referrer).map_err(|e| e.into())
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleSpecifier>,
        _is_dyn_import: bool,
    ) -> std::pin::Pin<Box<deno_core::ModuleSourceFuture>> {
        let module_specifier = module_specifier.clone();
        let module_cache = self.module_cache.clone();
        let reload_cache = self.options.reload_cache;

        async move {
            // Determine what the MediaType is (this is done based on the file
            // extension) and whether transpiling is required.
            let media_type = MediaType::from_specifier(&module_specifier);
            let (module_type, should_transpile) = match media_type {
                MediaType::JavaScript => (deno_core::ModuleType::JavaScript, false),
                MediaType::Jsx => (deno_core::ModuleType::JavaScript, true),
                MediaType::TypeScript | MediaType::Tsx => (deno_core::ModuleType::JavaScript, true),
                MediaType::Json => (deno_core::ModuleType::Json, false),
                _ => panic!(
                    "Unsupported extension {:?}",
                    module_specifier
                        .to_file_path()
                        .expect("Failed extracting file extension")
                        .extension()
                ),
            };

            let (code, requires_caching) = match module_specifier.scheme() {
                "http" | "https" => match module_cache.get(&module_specifier) {
                    Ok(code) if !reload_cache => (code, false),
                    Err(_) | Ok(_) => {
                        let response = reqwest::get(module_specifier.as_str()).await?;
                        if !response.status().is_success() {
                            bail!("Failed fetching {}", module_specifier);
                        }

                        let code = response.text().await?;
                        (code, true)
                    }
                },
                "file" => {
                    let code = std::fs::read_to_string(&module_specifier.path())?;
                    (code, false)
                }
                scheme => panic!("Unsupported url scheme {:?}", scheme),
            };

            // Transpile if necessary.
            let code = if should_transpile {
                let parsed = deno_ast::parse_module(ParseParams {
                    specifier: module_specifier.to_string(),
                    text_info: SourceTextInfo::from_string(code),
                    media_type,
                    capture_tokens: false,
                    scope_analysis: false,
                    maybe_syntax: None,
                })?;
                parsed.transpile(&Default::default())?.text
            } else {
                code
            };

            if requires_caching {
                module_cache.add(&module_specifier, code.clone())?;
            }

            // Load and return module.
            Ok(deno_core::ModuleSource::new(
                module_type,
                code.into(),
                &module_specifier,
            ))
        }
        .boxed_local()
    }
}
