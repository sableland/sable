use std::cell::{Ref, RefCell, RefMut};

#[derive(Debug, Default)]
pub struct PromiseMetricsSummary {
    pub test_name: String,
    pub promises_initialized: u64,
    pub promises_resolved: u64,
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
}

#[derive(Debug, Default)]
pub struct PromiseMetricsSummaryTracker {
    tracked: RefCell<usize>,
    metrics: RefCell<Vec<PromiseMetricsSummary>>,
}

impl PromiseMetricsSummaryTracker {
    pub fn per_promise(&self) -> Ref<'_, Vec<PromiseMetricsSummary>> {
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

    pub fn metrics_mut(&self) -> RefMut<PromiseMetricsSummary> {
        RefMut::map(self.metrics.borrow_mut(), |metrics| {
            &mut metrics[*self.tracked.borrow()]
        })
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
