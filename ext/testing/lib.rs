use deno_core::{op2, v8, JsRuntime, OpMetricsSummaryTracker, OpState};
use diff::{PrettyDiffBuilder, PrettyDiffBuilderConfig};
use std::{rc::Rc, time::Instant};

mod promise_tracker;
pub use promise_tracker::PromiseMetricsSummaryTracker;

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
pub fn op_test_sanitization(state: &OpState) -> bool {
    let op_metrics_tracker = state.borrow::<Option<Rc<OpMetricsSummaryTracker>>>();
    let ops_ok = match op_metrics_tracker {
        None => true,
        Some(tracker) => {
            let summary = tracker.aggregate();
            !summary.has_outstanding_ops()
        }
    };

    let promise_metrics_tracker = state.borrow::<Option<Rc<PromiseMetricsSummaryTracker>>>();
    let promises_ok = match promise_metrics_tracker {
        None => true,
        Some(tracker) => {
            let summary = tracker.aggregate();
            !summary.has_pending_promises()
        }
    };

    ops_ok && promises_ok
}

extern "C" fn sanitization_promise_hook<'a, 'b>(
    hook_type: v8::PromiseHookType,
    promise: v8::Local<'a, v8::Promise>,
    _: v8::Local<'b, v8::Value>,
) {
    let scope = unsafe { &mut v8::CallbackScope::new(promise) };
    let state = JsRuntime::op_state_from(scope); // scopes deref into &Isolate
    let mut state = state.borrow_mut();

    let metrics_tracker = state
        .borrow_mut::<Option<Rc<PromiseMetricsSummaryTracker>>>()
        .as_ref()
        .unwrap();

    let mut metrics = metrics_tracker.metrics_mut();

    match hook_type {
        v8::PromiseHookType::Init => {
            metrics.promises_initialized += 1;
        }
        v8::PromiseHookType::Resolve => {
            metrics.promises_resolved += 1;
        }
        _ => {}
    }
}

#[op2(fast)]
pub fn op_set_promise_sanitization_name(state: &mut OpState, #[string] test_name: String) {
    let Some(tracker) = state.borrow_mut::<Option<Rc<PromiseMetricsSummaryTracker>>>() else {
        return;
    };
    tracker.track(test_name);
}

#[op2]
pub fn op_set_promise_sanitization_hook(scope: &mut v8::HandleScope) {
    scope.set_promise_hook(sanitization_promise_hook);
}
