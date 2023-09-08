use deno_core::{anyhow::bail, error::AnyError, op, op2, CancelFuture, CancelHandle, OpState};
use std::{cell::RefCell, rc::Rc, time::Duration};

pub struct TimerInfo {
    pub next_id: usize,
    pub timers: Vec<(bool, Rc<CancelHandle>)>,
}

#[op2(fast)]
pub fn op_create_timer(#[state] timer_info: &mut TimerInfo) -> f64 {
    let current_id = timer_info.next_id;

    timer_info.next_id += 1;
    timer_info.timers.push((true, Rc::new(CancelHandle::new())));

    current_id as f64
}

#[op2(async)]
pub async fn op_queue_timer(
    state: Rc<RefCell<OpState>>,
    #[bigint] id: usize,
    duration: u32,
) -> Result<bool, AnyError> {
    let cancel_handle = {
        let state = state.borrow();
        let timer_info = state.borrow::<TimerInfo>();

        if let Some(timer) = timer_info.timers.get(id) {
            timer.1.clone()
        } else {
            bail!("Tried queueing Timer with id: {id} but it doesn't exist")
        }
    };

    let result = tokio::time::sleep(Duration::from_millis(duration.into()))
        .or_cancel(&cancel_handle)
        .await;

    Ok(result.is_ok() && !cancel_handle.is_canceled())
}

// TODO(Im-Beast): convert to op2 when deferred will be suported
#[op(deferred)]
pub async fn op_queue_timer_deferred(
    state: Rc<RefCell<OpState>>,
    id: usize,
) -> Result<bool, AnyError> {
    let cancel_handle = {
        let state = state.borrow();
        let timer_info = state.borrow::<TimerInfo>();

        if let Some(timer) = timer_info.timers.get(id) {
            timer.1.clone()
        } else {
            bail!("Tried queueing Timer with id: {id} but it doesn't exist")
        }
    };

    Ok(!cancel_handle.is_canceled())
}

#[op2(fast)]
pub fn op_clear_timer(state: &mut OpState, #[bigint] id: usize) {
    let timer_info = state.borrow_mut::<TimerInfo>();

    if let Some(timer) = timer_info.timers.get_mut(id) {
        timer.0 = false;
        timer.1.cancel();
    }
}
