use deno_core::{op2, v8};
use diff::{PrettyDiffBuilder, PrettyDiffBuilderConfig};
use std::time::Instant;

pub const TEST_STATE_VALUE: isize = 1;
pub const BENCH_STATE_VALUE: isize = 2;

mod diff;
use imara_diff::{diff, intern::InternedInput, Algorithm};

const NS_IN_MS: f64 = 1e+6;

const DIFF_CONFIG: PrettyDiffBuilderConfig = PrettyDiffBuilderConfig {
    lines_after_diff: 2,
    lines_before_diff: 2,
    print_first_and_last_lines: true,
};

/* Benchmark given function

It actually benchmarks that function twice:
 - first to warmup the function and break potential JIT bias
 - second run is the one that gets returned

It confirms that results are stable by checking the difference
between current function call and the average is smaller than 5e-6 (500NS)

Returns a number in milliseconds with nanosecond precision
Which means how long one run of that function takes */
#[op2]
pub fn op_bench_fn(scope: &mut v8::HandleScope, func: &v8::Function) -> f64 {
    let recv = v8::Integer::new(scope, 1).into();
    let args = &[];

    let mut avg: f64 = 0.0;
    let mut time: f64;

    for _ in 0..2 {
        avg = 0.0;
        time = 1.0;

        while (time - avg).abs() > 5e-6 * time {
            let now = Instant::now();
            func.call(scope, recv, args);
            time = now.elapsed().as_nanos() as f64;

            avg = (avg + time) / 2.0;
        }
    }

    avg as f64 / NS_IN_MS
}

#[op2]
#[string]
pub fn op_diff_str(#[string] before: &str, #[string] after: &str) -> String {
    let input = InternedInput::new(before, after);
    let diff_builder = PrettyDiffBuilder::new(&input, DIFF_CONFIG);
    diff(Algorithm::Histogram, &input, diff_builder)
}

/** Returns whether there are no async ops running in the background */
#[op2(fast)]
pub fn op_test_async_ops_sanitization() -> bool {
    // FIXME(Im-Beast): Since https://github.com/denoland/deno_core/pull/295 metrics have changed a lot
    // And will require a bit more care
    return true;
}
