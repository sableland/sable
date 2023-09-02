pub mod extensions {
    use bueno_ext_fetch as fetch;
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
            fs::op_remove_file_sync,
            // fetch
            fetch::op_fetch,
        ],
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            "bueno.js",
            "console.js",
            "fetch.js",
            "runtime.js",
            "io/mod.js",
            "io/stdio.js",
            "fs/mod.js",
            "fetch/mod.js",
        ],
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = ["cleanup.js",],
    );
}
