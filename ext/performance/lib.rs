use deno_core::{error::AnyError, op2, OpState};
use std::time::{Instant, SystemTime};

const NS_IN_MS: f64 = 1e+6;

// Returns time in milliseconds with nanosecond precision since runtime's start
#[op2(fast)]
pub fn op_high_res_time(state: &mut OpState) -> f64 {
    let origin_time = state.borrow::<Instant>();

    let elapsed_ns = origin_time.elapsed().subsec_nanos();
    // TODO: coarsen time whenever necessary

    elapsed_ns as f64 / NS_IN_MS
}

// Returns time in milliseconds with nanosecond precision since unix epoch
#[op2(fast)]
pub fn op_time_origin(state: &mut OpState) -> Result<f64, AnyError> {
    let origin_time = state.borrow::<SystemTime>();

    let duration_ms = origin_time
        .duration_since(SystemTime::UNIX_EPOCH)?
        .as_nanos();

    Ok(duration_ms as f64 / NS_IN_MS)
}
