use deno_core::{op2, v8};
use std::time::Instant;

const NS_IN_MS: f64 = 1e+6;

/*
Benchmark given function

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