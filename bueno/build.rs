use std::fs::File;
use std::path::PathBuf;
use std::{env, io::Write};

use bueno_ext::extensions::bueno;
use deno_core::snapshot::{create_snapshot, CreateSnapshotOptions};

fn main() {
    // Build the file path to the snapshot.
    let out = PathBuf::from(env::var_os("OUT_DIR").unwrap());
    let snapshot_path = out.join("BUENO_RUNTIME_SNAPSHOT.bin");

    // Create the snapshot.
    let output = create_snapshot(
        CreateSnapshotOptions {
            extension_transpiler: None,
            skip_op_registration: false,
            cargo_manifest_dir: env!("CARGO_MANIFEST_DIR"),
            extensions: vec![bueno::init_ops_and_esm()],
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
