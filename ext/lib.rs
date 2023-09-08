pub mod extensions {
    use std::time::{Instant, SystemTime};

    use bueno_ext_fs as fs;
    use bueno_ext_performance as performance;
    use bueno_ext_timers as timers;

    deno_core::extension!(
        bueno,
        ops = [
            fs::op_read_file,
            fs::op_read_text_file,
            fs::op_write_file,
            fs::op_write_text_file,
            fs::op_remove_file,
            fs::op_remove_dir,
            performance::op_high_res_time,
            performance::op_time_origin,
            timers::op_create_timer,
            timers::op_queue_timer,
            timers::op_queue_timer_deferred,
            timers::op_clear_timer,
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
            "console/table.js",
            "performance/mod.js",
            "timers/mod.js",
            "webidl/mod.js",
            "webidl/numbers.js",
            "webidl/integers.js",
        ],
        state = |state| {
            {
                // bueno_ext_perf
                state.put(Instant::now());
                state.put(SystemTime::now());
            };

            {
                // bueno_ext_timers
                state.put(timers::TimerInfo {
                    next_id: 0,
                    timer_handles: vec![],
                });
            };
        }
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = ["cleanup.js",],
    );
}
