use deno_core::{op2, CancelFuture, CancelHandle, OpState, ResourceId};
use std::{cell::RefCell, cmp::Reverse, collections::BinaryHeap, rc::Rc, time::Duration};
use tokio::time::Instant;

pub struct TimerEntry {
    id: i32,
    deadline: Instant,
    enqueued: Instant,
    cancel_handle: Rc<CancelHandle>,
}
impl PartialEq for TimerEntry {
    fn eq(&self, other: &Self) -> bool {
        // We ignore the id and the cancel handle for equality and comparison
        // purposes
        self.deadline == other.deadline && self.enqueued == other.enqueued
    }
}
impl PartialOrd for TimerEntry {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}
impl Eq for TimerEntry {}
impl Ord for TimerEntry {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        match self.deadline.cmp(&other.deadline) {
            std::cmp::Ordering::Equal => self.enqueued.cmp(&other.enqueued),
            ord => ord,
        }
    }
}

pub struct TimerInfo {
    pub entries: BinaryHeap<Reverse<TimerEntry>>,
}

// Waits until the next timer fires, and returns its id, or None if there are no
// active timers.
#[op2(async)]
pub async fn op_timers_sleep(op_state: Rc<RefCell<OpState>>) -> Option<i32> {
    loop {
        let id;
        let deadline;
        let cancel_handle;

        {
            let op_state = &mut op_state.borrow_mut();
            let timer_entries = &mut op_state.borrow_mut::<TimerInfo>().entries;

            // Find the first non-canceled entry
            loop {
                if timer_entries.is_empty() {
                    return None;
                }
                let entry = &timer_entries.peek().unwrap().0;
                if entry.cancel_handle.is_canceled() {
                    timer_entries.pop().unwrap();
                } else {
                    id = entry.id;
                    deadline = entry.deadline;
                    cancel_handle = entry.cancel_handle.clone();
                    break;
                }
            }
        }

        let sleep_result = tokio::time::sleep_until(deadline)
            .or_cancel(cancel_handle)
            .await;

        if sleep_result.is_ok() {
            let op_state = &mut op_state.borrow_mut();
            let timer_entries = &mut op_state.borrow_mut::<TimerInfo>().entries;
            let entry = timer_entries.pop().unwrap().0;
            assert_eq!(entry.id, id);
            assert!(!entry.cancel_handle.is_canceled());
            return Some(id);
        }
    }
}

// Create a new timer with an id and return its cancelable resource id
#[op2(fast)]
#[smi]
pub fn op_create_timer(op_state: &mut OpState, delay_ms: i32, id: i32) -> ResourceId {
    let now = Instant::now();
    let delay = Duration::from_millis(delay_ms.max(0) as u64);
    let deadline = now.checked_add(delay).unwrap();
    let cancel_handle = CancelHandle::new_rc();

    let timer_info = op_state.borrow_mut::<TimerInfo>();
    timer_info.entries.push(Reverse(TimerEntry {
        id,
        deadline,
        enqueued: now,
        cancel_handle: cancel_handle.clone(),
    }));

    op_state.resource_table.add_rc(cancel_handle)
}

// Clears timer with given id by canc
#[op2(fast)]
pub fn op_clear_timer(state: &mut OpState, #[smi] resource_id: ResourceId) {
    let cancel_handle = state
        .resource_table
        .take::<CancelHandle>(resource_id)
        .unwrap();
    cancel_handle.cancel();
}
