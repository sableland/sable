use std::{
    cell::{Ref, RefCell, RefMut},
    collections::BTreeSet,
    num::NonZeroI32,
};

#[derive(Debug, Default)]
pub struct PromiseMetricsSummary {
    pub test_name: String,
    pub promises_initialized: u64,
    pub promises_resolved: u64,
    promises: BTreeSet<NonZeroI32>,
}

impl PromiseMetricsSummary {
    pub fn with_name(test_name: String) -> Self {
        Self {
            test_name,
            ..Default::default()
        }
    }

    pub fn has_pending_promises(&self) -> bool {
        self.promises_initialized > self.promises_resolved
    }

    pub fn contains(&self, promise_id: NonZeroI32) -> bool {
        self.promises.contains(&promise_id)
    }

    pub fn initialized(&mut self, promise_id: NonZeroI32) {
        self.promises_initialized += 1;
        debug_assert!(
            self.promises.insert(promise_id),
            "Promise {promise_id} has been initialized twice"
        );
    }

    pub fn resolved(&mut self, promise_id: NonZeroI32) {
        self.promises_resolved += 1;
        // identity_hash is not guaranteed to be unique
        // we remove it in case it would be added again
        debug_assert!(
            self.promises.remove(&promise_id),
            "Promise {promise_id} not found"
        );
    }
}

#[derive(Debug, Default)]
pub struct PromiseMetricsSummaryTracker {
    tracked: RefCell<usize>,
    metrics: RefCell<Vec<PromiseMetricsSummary>>,
}

impl PromiseMetricsSummaryTracker {
    pub fn per_test(&self) -> Ref<'_, Vec<PromiseMetricsSummary>> {
        self.metrics.borrow()
    }

    pub fn aggregate(&self) -> PromiseMetricsSummary {
        let mut sum = PromiseMetricsSummary::default();
        for metrics in self.metrics.borrow().iter() {
            sum.promises_initialized += metrics.promises_initialized;
            sum.promises_resolved += metrics.promises_resolved;
        }
        sum
    }

    pub fn metrics(&self) -> Option<Ref<PromiseMetricsSummary>> {
        let metrics = self.metrics.borrow();
        if metrics.is_empty() {
            None
        } else {
            Some(Ref::map(metrics, |metrics| {
                &metrics[*self.tracked.borrow()]
            }))
        }
    }

    pub fn metrics_mut(&self) -> RefMut<PromiseMetricsSummary> {
        RefMut::map(self.metrics.borrow_mut(), |metrics| {
            &mut metrics[*self.tracked.borrow()]
        })
    }

    pub fn metrics_mut_with_promise(
        &self,
        promise_id: NonZeroI32,
    ) -> Option<RefMut<PromiseMetricsSummary>> {
        let metrics = self.metrics.borrow_mut();
        let i = metrics
            .iter()
            .position(|metrics| metrics.contains(promise_id));
        i.map(|i| RefMut::map(metrics, |metrics| &mut metrics[i]))
    }

    pub fn track(&self, name: String) {
        let mut metrics = self.metrics.borrow_mut();

        let i = metrics.iter().position(|metrics| name == metrics.test_name);
        *self.tracked.borrow_mut() = match i {
            Some(i) => i,
            None => {
                let index = metrics.len();
                metrics.push(PromiseMetricsSummary::with_name(name));
                index
            }
        };
    }
}
