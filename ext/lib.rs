pub mod extensions {
    use bueno_ext_fs as fs;

    deno_core::extension!(
        bueno,
        ops = [
            // read
            fs::op_read_file,
            fs::op_read_file_sync,
            fs::op_read_text_file,
            fs::op_read_text_file_sync,
            // write
            fs::op_write_file,
            fs::op_write_file_sync,
            fs::op_write_text_file,
            fs::op_write_text_file_sync,
            // remove
            fs::op_remove_file,
            fs::op_remove_file_sync
        ],
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            "bueno.js",
            "runtime.js",
            "io/mod.js",
            "io/stdio.js",
            "fs/mod.js",
            "console/mod.js",
            "console/printer.js",
            "console/formatter.js",
            "console/table.js"
        ],
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = ["cleanup.js",],
    );
}
