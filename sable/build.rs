use std::borrow::Cow;
use std::fs::File;
use std::path::PathBuf;
use std::rc::Rc;
use std::{env, io::Write};

use deno_ast::{parse_module, EmitOptions, MediaType, ParseParams, TranspileOptions};
use deno_core::snapshot::{create_snapshot, CreateSnapshotOptions};
use deno_core::url::Url;
use deno_core::FastString;
use sable_ext::extensions::sable;

fn main() {
    // Build the file path to the snapshot.
    let out = PathBuf::from(env::var_os("OUT_DIR").unwrap());
    let snapshot_path = out.join("SABLE_RUNTIME_SNAPSHOT.bin");

    let ts_transpiler = Rc::new(|module_name: FastString, code_string: FastString| {
        if module_name.ends_with(".ts") {
            let parsed = parse_module(ParseParams {
                specifier: Url::parse(&module_name).expect("Invalid module name"),
                text: code_string.into(),
                media_type: MediaType::TypeScript,
                capture_tokens: false,
                scope_analysis: false,
                maybe_syntax: None,
            })?;

            let transpiled = parsed.transpile(
                &TranspileOptions {
                    use_decorators_proposal: true,
                    ..Default::default()
                },
                &EmitOptions::default(),
            )?;

            let source_bytes = transpiled.into_source();

            Ok((
                String::from_utf8(source_bytes.source)?.into(),
                source_bytes.source_map.map(|bytes| Cow::Owned(bytes)),
            ))
        } else {
            Ok((code_string, None))
        }
    });

    // Create the snapshot.
    let output = create_snapshot(
        CreateSnapshotOptions {
            extension_transpiler: Some(ts_transpiler),
            skip_op_registration: false,
            cargo_manifest_dir: env!("CARGO_MANIFEST_DIR"),
            extensions: vec![sable::init_ops_and_esm()],
            startup_snapshot: None,
            with_runtime_cb: None,
        },
        None,
    )
    .expect("Failed to create snapshot");

    for path in output.files_loaded_during_snapshot {
        println!("Loaded during snapshot: {}", path.display());
    }

    let mut file = File::create(&snapshot_path).expect("Failed to create snapshot file");
    file.write_all(&output.output)
        .expect("Failed to save snapshot to a file");
}
