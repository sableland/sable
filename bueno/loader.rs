use std::sync::Arc;

use deno_ast::MediaType;
use deno_core::{
    anyhow::Error, error::generic_error, futures::FutureExt, ModuleCodeBytes, ModuleLoadResponse,
    ModuleLoader, ModuleSource, ModuleSourceCode, ModuleSpecifier, ModuleType, RequestedModuleType,
};
use tokio::fs;

use crate::{module_cache::ModuleCache, BuenoOptions};

pub struct BuenoModuleLoader {
    pub module_cache: Arc<ModuleCache>,
    pub options: BuenoOptions,
}

fn media_type_to_module_type(media_type: &MediaType) -> Result<ModuleType, Error> {
    let media_type = match media_type {
        MediaType::Mjs | MediaType::JavaScript => ModuleType::JavaScript,
        MediaType::Json => ModuleType::Json,
        _ => {
            return Err(generic_error(format!(
                "Unsupported media type {}",
                media_type
            )))
        }
    };

    Ok(media_type)
}

impl ModuleLoader for BuenoModuleLoader {
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
        requested_module_type: RequestedModuleType,
    ) -> ModuleLoadResponse {
        let module_specifier = module_specifier.clone();
        let module_cache = self.module_cache.clone();
        let reload_cache = self.options.reload_cache;

        let module_source = async move {
            if !reload_cache {
                if let Ok(source_code) = module_cache.get(&module_specifier).await {
                    println!("Using cached {}", module_specifier);
                    return Ok(ModuleSource::new(
                        media_type_to_module_type(&MediaType::from_specifier(&module_specifier))?,
                        ModuleSourceCode::Bytes(ModuleCodeBytes::Boxed(source_code)),
                        &module_specifier,
                    ));
                }
            }

            let scheme = module_specifier.scheme();
            let media_type = MediaType::from_specifier(&module_specifier);

            let (media_type, source_code, should_cache) = match scheme {
                "http" | "https" => {
                    let response = reqwest::get(module_specifier.as_str()).await?;

                    let media_type = if media_type == MediaType::Unknown {
                        response
                            .headers()
                            .get(reqwest::header::CONTENT_TYPE)
                            .map_or(media_type, |ct| {
                                ct.to_str().map_or(media_type, |str| {
                                    MediaType::from_content_type(&module_specifier, str)
                                })
                            })
                    } else {
                        media_type
                    };

                    let source_code = ModuleSourceCode::String(response.text().await?.into());

                    (media_type, source_code, true)
                }
                "file" => {
                    let path = &module_specifier.to_file_path().map_err(|_| {
                        generic_error(format!(
                            "Failed to convert module specifier ({}) to file path",
                            module_specifier
                        ))
                    })?;

                    let file_contents = fs::read(path).await?;
                    let source_code = ModuleSourceCode::Bytes(ModuleCodeBytes::Boxed(
                        file_contents.into_boxed_slice(),
                    ));

                    (media_type, source_code, false)
                }
                scheme => return Err(generic_error(format!("Unsupported scheme {}", scheme))),
            };

            if should_cache {
                println!("Caching {}", module_specifier);
                module_cache.add(&module_specifier, &source_code).await?;
            }

            let module_type = media_type_to_module_type(&media_type)?;

            if module_type == ModuleType::Json && requested_module_type != RequestedModuleType::Json
            {
                return Err(generic_error(format!(
                    "Cannot load JSON module as {}.\nTo load the module as JSON specify the `with {{ type: \"json\" }}` attribute",
                    requested_module_type
                )));
            }

            Ok(ModuleSource::new(
                module_type,
                source_code,
                &module_specifier,
            ))
        }
        .boxed_local();

        ModuleLoadResponse::Async(module_source)
    }
}
