extern crate bueno_ext;
extern crate deno_core;

use deno_core::{error::AnyError, url::Url, Snapshot};
use loader::BuenoModuleLoader;
use std::{env, path::PathBuf, rc::Rc, sync::Arc};

mod cli;
mod loader;
mod module_cache;

use cli::parse_cli;
use module_cache::ModuleCache;

use bueno_ext::extensions::{bueno, bueno_cleanup};

static RUNTIME_SNAPSHOT: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/BUENO_RUNTIME_SNAPSHOT.bin"));

pub struct BuenoOptions {
    clean_cache: bool,
    reload_cache: bool,
}

pub async fn bueno_run(file_path: &str, options: BuenoOptions) -> Result<(), AnyError> {
    let main_module = if let Ok(url) = Url::parse(file_path) {
        url
    } else {
        deno_core::resolve_path(file_path, &env::current_dir().unwrap())?
    };

    let module_cache = Arc::new(ModuleCache {
        cache_location: PathBuf::from(shellexpand::full("~/.cache/bueno/modules")?.to_string()),
    });

    if options.clean_cache {
        module_cache.clear()?;
    }

    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        startup_snapshot: Some(Snapshot::Static(RUNTIME_SNAPSHOT)),
        module_loader: Some(Rc::new(BuenoModuleLoader {
            module_cache,
            options,
        })),
        extensions: vec![bueno::init_ops(), bueno_cleanup::init_ops_and_esm()],
        ..Default::default()
    });

    let mod_id = js_runtime.load_main_module(&main_module, None).await?;
    let result = js_runtime.mod_evaluate(mod_id);
    js_runtime.run_event_loop(false).await?;

    result.await?
}

fn main() {
    parse_cli();
}
