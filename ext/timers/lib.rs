use deno_core::{op2, CancelFuture, CancelHandle, OpState, Resource, ResourceId};
use std::{cell::RefCell, cmp::Reverse, collections::BinaryHeap, rc::Rc, time::Duration};
use tokio::time::Instant;

struct TimerHandle(RefCell<Rc<CancelHandle>>);
impl TimerHandle {
    fn new_rc() -> Rc<Self> {
        Rc::new(Self(RefCell::new(CancelHandle::new_rc())))
    }
    fn is_canceled(&self) -> bool {
        self.0.borrow().is_canceled()
    }
    fn cancel_handle(&self) -> Rc<CancelHandle> {
        self.0.borrow().clone()
    }
    fn cancel_and_replace(&self) {
        if !self.is_canceled() {
            let old_cancel_handle = self.0.replace(CancelHandle::new_rc());
            old_cancel_handle.cancel();
        }
    }
}
impl Resource for TimerHandle {
    fn close(self: Rc<Self>) {
        if !self.is_canceled() {
            self.0.borrow().cancel();
        }
    }
}

pub struct TimerEntry {
    id: i32,
    deadline: Instant,
    enqueued: Instant,
    handle: Rc<TimerHandle>,
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

pub type TimerQueue = BinaryHeap<Reverse<TimerEntry>>;

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
            let timer_queue = op_state.borrow_mut::<TimerQueue>();

            // Find the first non-canceled entry
            loop {
                if timer_queue.is_empty() {
                    return None;
                }
                let entry = &timer_queue.peek().unwrap().0;
                if entry.handle.is_canceled() {
                    timer_queue.pop().unwrap();
                } else {
                    id = entry.id;
                    deadline = entry.deadline;
                    cancel_handle = entry.handle.cancel_handle();
                    break;
                }
            }
        }

        let sleep_result = tokio::time::sleep_until(deadline)
            .or_cancel(cancel_handle)
            .await;

        if sleep_result.is_ok() {
            let op_state = &mut op_state.borrow_mut();
            let timer_queue = &mut op_state.borrow_mut::<TimerQueue>();
            let entry = timer_queue.pop().unwrap().0;
            assert_eq!(entry.id, id);
            assert!(!entry.handle.is_canceled());
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
    let timer_handle = TimerHandle::new_rc();

    let entry = TimerEntry {
        id,
        deadline,
        enqueued: now,
        handle: timer_handle.clone(),
    };

    let timer_queue = op_state.borrow_mut::<TimerQueue>();
    if let Some(first_entry) = timer_queue.peek() {
        if entry <= first_entry.0 {
            first_entry.0.handle.cancel_and_replace();
        }
    }
    timer_queue.push(Reverse(entry));

    op_state.resource_table.add_rc(timer_handle)
}
