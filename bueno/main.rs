extern crate bueno_ext;
extern crate deno_core;

use deno_core::{error::AnyError, Snapshot};
use std::{env, rc::Rc};
use ts_loader::TsModuleLoader;

mod cli;
mod ts_loader;

use cli::parse_cli;

use bueno_ext::extensions::*;

static RUNTIME_SNAPSHOT: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/BUENO_RUNTIME_SNAPSHOT.bin"));

pub async fn bueno_run(file_path: &str) -> Result<(), AnyError> {
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
