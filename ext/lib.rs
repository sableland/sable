pub mod extensions {
    pub use sable_ext_battery as battery;
    pub use sable_ext_crypto as crypto;
    pub use sable_ext_fs as fs;
    pub use sable_ext_performance as performance;
    pub use sable_ext_runtime as runtime;
    pub use sable_ext_testing as testing;
    pub use sable_ext_timers as timers;
    pub use sable_ext_web as web;

    use deno_core::OpMetricsSummaryTracker;
    use runtime::RuntimeState;
    use std::rc::Rc;
    use std::time::Instant;
    use std::time::SystemTime;
    use testing::PromiseMetricsSummaryTracker;
    use timers::TimerQueue;

    deno_core::extension!(
        sable,
        ops = [
            battery::op_battery_charging,
            battery::op_battery_charging_time,
            battery::op_battery_discharging_time,
            battery::op_battery_level,
            crypto::op_crypto_new_uuidv4,
            runtime::op_runtime_state,
            fs::op_read_file,
            fs::op_read_text_file,
            fs::op_write_file,
            fs::op_write_text_file,
            fs::op_remove_file,
            fs::op_remove_dir,
            performance::op_high_res_time,
            performance::op_time_origin,
            timers::op_timers_sleep,
            timers::op_create_timer,
            testing::op_bench_fn,
            testing::op_diff_str,
            testing::op_get_outstanding_ops,
            testing::op_get_pending_promises,
            testing::op_set_promise_sanitization_hook,
            testing::op_set_promise_sanitized_test_name,
            web::op_encoding_normalize_label,
            web::op_encoding_decode_utf8,
            web::op_encoding_decode_single,
        ],
        esm_entry_point = "ext:sable/runtime.js",
        esm = [
            "sable.js",
            "runtime.js",
            "io/mod.js",
            "io/stdio.js",
            "fs/mod.js",
            "battery/mod.ts",
            "web/mod.js",
            "web/events.js",
            "web/encoding.js",
            "console/mod.js",
            "console/printer.js",
            "console/formatter.js",
            "console/css.js",
            "console/table.js",
            "crypto/mod.ts",
            "performance/mod.js",
            "timers/mod.js",
            "webidl/mod.js",
            "webidl/numbers.js",
            "webidl/integers.js",
            "utils/ansi.js",
            "utils/char_width.js",
            "utils/escape_control_chars.js",
            "utils/loop_ansi.js",
            "utils/text_width.js",
            "testing/mod.js",
        ],
        state = |state| {
            // sable_ext_runtime
            state.put(RuntimeState::Default);

            // sable_ext_perf
            state.put(Instant::now());
            state.put(SystemTime::now());

            // sable_ext_timers
            state.put(TimerQueue::new());

            // sable_ext_testing
            state.put::<Option<Rc<OpMetricsSummaryTracker>>>(None);
            state.put::<Option<Rc<PromiseMetricsSummaryTracker>>>(None);
        }
    );

    deno_core::extension!(
        sable_cleanup,
        esm_entry_point = "ext:sable_cleanup/cleanup.js",
        esm = ["cleanup.js"],
    );
}
