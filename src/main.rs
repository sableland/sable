use cli::parse_cli;
use deno_core::{error::AnyError, Snapshot};
use std::{env, rc::Rc};

mod cli;
mod ts_loader;

use ts_loader::TsModuleLoader;

static RUNTIME_SNAPSHOT: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/BUENO_RUNTIME_SNAPSHOT.bin"));

pub async fn bueno_run(file_path: &str) -> Result<(), AnyError> {
    deno_core::extension!(
        bueno,
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            dir "ext",
            "bueno.js",
            "console.js",
            "runtime.js",
         ],
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = [
            dir "ext",
            "cleanup.js",
         ],
    );

    let main_module = deno_core::resolve_path(file_path, &env::current_dir().unwrap())?;

    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        startup_snapshot: Some(Snapshot::Static(RUNTIME_SNAPSHOT)),
        module_loader: Some(Rc::new(TsModuleLoader)),
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
