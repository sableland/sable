pub mod extensions {
    use std::time::{Instant, SystemTime};
    use bueno_ext_fs as fs;
    use bueno_ext_performance as performance;
    use bueno_ext_battery as battery;

    deno_core::extension!(
        bueno,
        ops = [
            battery::op_battery_charging,
            battery::op_battery_level,
            fs::op_read_file,
            fs::op_read_text_file,
            fs::op_write_file,
            fs::op_write_text_file,
            fs::op_remove_file,
            fs::op_remove_dir,
            performance::op_high_res_time,
            performance::op_time_origin,
        ],
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            "bueno.js",
            "runtime.js",
            "io/mod.js",
            "io/stdio.js",
            "fs/mod.js",
            "battery/mod.js",
            "web/mod.js",
            "web/events.js",
            "console/mod.js",
            "console/printer.js",
            "console/formatter.js",
            "console/table.js",
            "performance/mod.js",
        ],
        state = |state| {
            {
                // bun_ext_perf
                state.put(Instant::now());
                state.put(SystemTime::now());
            };
        }
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = ["cleanup.js",],
    );
}
