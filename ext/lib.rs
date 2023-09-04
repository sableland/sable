pub mod extensions {
    use bueno_ext_battery as battery;
    use bueno_ext_fs as fs;

    deno_core::extension!(
        bueno,
        ops = [
            battery::op_battery_charging,
            battery::op_battery_level,
            // read
            fs::op_read_file,
            fs::op_read_text_file,
            // write
            fs::op_write_file,
            fs::op_write_text_file,
            // remove
            fs::op_remove_file,
            fs::op_remove_dir,
        ],
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            "bueno.js",
            "console.js",
            "runtime.js",
            "io/mod.js",
            "io/stdio.js",
            "fs/mod.js",
            "battery/mod.js",
            "web/mod.js",
            "web/events.js",
        ],
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = ["cleanup.js",],
    );
}
