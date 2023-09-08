use deno_core::{anyhow::bail, error::AnyError, op, op2, CancelFuture, CancelHandle, OpState};
use std::{cell::RefCell, rc::Rc, time::Duration};

pub struct TimerInfo {
    pub next_id: usize,
    pub timer_handles: Vec<Rc<CancelHandle>>,
}

// Create a new timer and return its id
#[op2(fast)]
pub fn op_create_timer(#[state] timer_info: &mut TimerInfo) -> f64 {
    let current_id = timer_info.next_id;

    timer_info.next_id += 1;
    timer_info.timer_handles.push(Rc::new(CancelHandle::new()));

    current_id as f64
}

// Queue timer with given id to execute after specified delay
// Returns boolean which asserts whether timer should finally run its callback or not
#[op2(async)]
pub async fn op_queue_timer(
    state: Rc<RefCell<OpState>>,
    #[bigint] id: usize,
    delay: u32,
) -> Result<bool, AnyError> {
    let cancel_handle = {
        let state = state.borrow();
        let timer_info = state.borrow::<TimerInfo>();

        if let Some(timer) = timer_info.timer_handles.get(id) {
            timer.clone()
        } else {
            bail!("Tried queueing Timer with id: {id} but it doesn't exist")
        }
    };

    if cancel_handle.is_canceled() {
        Ok(false)
    } else {
        let result = tokio::time::sleep(Duration::from_millis(delay.into()))
            .or_cancel(&cancel_handle)
            .await;

        Ok(result.is_ok() && !cancel_handle.is_canceled())
    }
}

// TODO(Im-Beast): convert to op2 when deferred will be suported
// Queue timer with given id to run at the end of event loop
// Returns boolean which asserts whether timer should finally run its callback or nots
#[op(deferred)]
pub async fn op_queue_timer_deferred(
    state: Rc<RefCell<OpState>>,
    id: usize,
) -> Result<bool, AnyError> {
    let cancel_handle = {
        let state = state.borrow();
        let timer_info = state.borrow::<TimerInfo>();

        if let Some(timer) = timer_info.timer_handles.get(id) {
            timer.clone()
        } else {
            bail!("Tried queueing Timer with id: {id} but it doesn't exist")
        }
    };

    Ok(!cancel_handle.is_canceled())
}

// Clears timer with given id by canc
#[op2(fast)]
pub fn op_clear_timer(state: &mut OpState, #[bigint] id: usize) {
    let timer_info = state.borrow_mut::<TimerInfo>();

    if let Some(timer) = timer_info.timer_handles.get_mut(id) {
        timer.cancel();
    }
}
