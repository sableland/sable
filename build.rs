use std::env;
use std::path::PathBuf;

fn main() {
    // Build the file path to the snapshot.
    let out = PathBuf::from(env::var_os("OUT_DIR").unwrap());
    let snapshot_path = out.join("BUENO_SNAPSHOT.bin");

    deno_core::extension!(
        bueno,
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            dir "src/ext",
            "bueno.js",
            "console.js",
            "fs.js",
            "runtime.js",
         ],
    );

    // Create the snapshot.
    let output = deno_core::snapshot_util::create_snapshot(
        deno_core::snapshot_util::CreateSnapshotOptions {
            snapshot_path,
            cargo_manifest_dir: env!("CARGO_MANIFEST_DIR"),
            extensions: vec![bueno::init_ops_and_esm()],
            startup_snapshot: None,
            compression_cb: None,
            with_runtime_cb: None,
        },
    );

    for path in output.files_loaded_during_snapshot {
        println!("Loaded during snapshot: {}", path.display());
    }
}
