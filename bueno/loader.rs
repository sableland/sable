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
            let scheme = module_specifier.scheme();
            let mut response: Option<reqwest::Response> = None;

            // Determine what the MediaType is (this is done based on the file
            // extension) and whether transpiling is required.
            let mut media_type = MediaType::from_specifier(&module_specifier);

            // If MediaType is unknown and it's an URL then check the
            // MediaType from Content-Type header of the response
            if media_type == MediaType::Unknown && scheme != "file" {
                println!("getting MediaType from URL");
                response = Some(reqwest::get(module_specifier.as_str()).await?);

                media_type = MediaType::from_content_type(
                    &module_specifier,
                    &response
                        .as_ref()
                        .unwrap()
                        .headers()
                        .get(reqwest::header::CONTENT_TYPE)
                        .unwrap()
                        .to_str()
                        .unwrap(),
                );

                println!("got mediatype: {}", media_type.to_string());
            }

            let (module_type, should_transpile) = match media_type {
                MediaType::Mjs | MediaType::JavaScript => {
                    (deno_core::ModuleType::JavaScript, false)
                }
                MediaType::Jsx => (deno_core::ModuleType::JavaScript, true),
                MediaType::Dmts | MediaType::Dts | MediaType::TypeScript | MediaType::Tsx => {
                    (deno_core::ModuleType::JavaScript, true)
                }
                MediaType::Json => (deno_core::ModuleType::Json, false),
                mt => {
                    // TODO: Better errors
                    let path = module_specifier.to_file_path();
                    if let Ok(path) = path {
                        panic!("Unsupported extension {:?}", path.extension())
                    } else {
                        panic!("Unsupported MimeType {mt}")
                    }
                }
            };

            let (code, requires_caching) = match scheme {
                "http" | "https" => match module_cache.get(&module_specifier) {
                    Ok(code) if !reload_cache => (code, false),
                    Err(_) | Ok(_) => {
                        if response.is_none() {
                            response = Some(reqwest::get(module_specifier.as_str()).await?);
                        }

                        let unwrapped = response.unwrap();

                        if !unwrapped.status().is_success() {
                            bail!("Failed fetching {}", module_specifier);
                        }

                        let code = unwrapped.text().await?;
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
