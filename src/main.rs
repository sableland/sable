use cli::parse_cli;
use deno_core::error::AnyError;
use std::{env, rc::Rc};

mod cli;

pub async fn bueno_run(file_path: &str) -> Result<(), AnyError> {
    deno_core::extension!(
        bueno,
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            dir "src/ext",
            "bueno.js",
            "console.js",
            "runtime.js",
            "cleanup.js",
         ],
    );

    let main_module = deno_core::resolve_path(file_path, &env::current_dir().unwrap())?;

    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        module_loader: Some(Rc::new(deno_core::FsModuleLoader)),
        extensions: vec![bueno::init_ops_and_esm()],
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
