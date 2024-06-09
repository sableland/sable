extern crate deno_core;
extern crate sable_ext;

use deno_core::{
    error::AnyError, url::Url, Extension, JsRuntime, OpMetricsSummaryTracker, RuntimeOptions,
};
use loader::SableModuleLoader;
use std::{
    env,
    hash::{DefaultHasher, Hash, Hasher},
    path::PathBuf,
    process::ExitCode,
    rc::Rc,
    sync::Arc,
};

mod cli;
mod loader;
mod module_cache;
mod tools;
mod utils;

use cli::parse_cli;
use module_cache::ModuleCache;

use sable_ext::extensions::{
    runtime::RuntimeState, sable, sable_cleanup, storage::LocalStoragePath,
};

static RUNTIME_SNAPSHOT: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/SABLE_RUNTIME_SNAPSHOT.bin"));

pub struct SableOptions {
    clean_cache: bool,
    reload_cache: bool,
    state: RuntimeState,
}

pub async fn sable_run(file_path: &str, options: SableOptions) -> Result<(), AnyError> {
    let current_dir = env::current_dir().unwrap();
    let main_module = if let Ok(url) = Url::parse(file_path) {
        url
    } else {
        deno_core::resolve_path(file_path, &current_dir)?
    };
    let absolute_module_path = current_dir.clone().join(main_module.path());

    let cache_path = PathBuf::from(shellexpand::full("~/.cache/sable/")?.into_owned());
    let module_cache = Arc::new(ModuleCache::new(cache_path.join("modules")));
    let local_storage_path = {
        let mut hasher = DefaultHasher::new();
        absolute_module_path.hash(&mut hasher);
        let hashed_module_path = hasher.finish();

        cache_path
            .join("local_storage/")
            .join(hashed_module_path.to_string())
    };

    if options.clean_cache {
        module_cache.clear().await?;
    }

    let mut maybe_tracker: Option<Rc<OpMetricsSummaryTracker>> = None;
    let mut extensions = vec![sable::init_ops(), sable_cleanup::init_ops_and_esm()];

    match options.state {
        RuntimeState::Test | RuntimeState::Bench => {
            maybe_tracker.replace(Rc::new(OpMetricsSummaryTracker::default()));
            let maybe_tracker = maybe_tracker.clone();
            extensions.push(Extension {
                name: "sable_testing",
                op_state_fn: Some(Box::new(move |state| {
                    state.put(options.state);
                    state.put(maybe_tracker);
                })),
                ..Default::default()
            });
        }
        _ => {}
    }

    let mut js_runtime = JsRuntime::new(RuntimeOptions {
        startup_snapshot: Some(RUNTIME_SNAPSHOT),
        op_metrics_factory_fn: maybe_tracker
            .map(|tracker| tracker.op_metrics_factory_fn(|op| op.is_async)),
        module_loader: Some(Rc::new(SableModuleLoader {
            module_cache,
            options,
        })),
        extensions,
        ..Default::default()
    });

    {
        let state = js_runtime.op_state();
        state
            .borrow_mut()
            .put(Some(LocalStoragePath(local_storage_path)));
    }

    let mod_id = js_runtime.load_main_es_module(&main_module).await?;
    let result = js_runtime.mod_evaluate(mod_id);
    js_runtime.run_event_loop(Default::default()).await?;

    result.await
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> ExitCode {
    parse_cli().await
}
