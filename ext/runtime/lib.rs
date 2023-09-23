use bueno_ext_testing;
use deno_core::{
    anyhow::{bail, Error},
    op2, OpState,
};
use std::str::FromStr;

// RuntimeState specifies whether Bueno runs in testing/benchmarking or normal mode
#[derive(Clone, PartialEq)]
pub enum RuntimeState {
    Default = 0,
    Test = bueno_ext_testing::TEST_STATE_VALUE,
    Bench = bueno_ext_testing::BENCH_STATE_VALUE,
}

impl ToString for RuntimeState {
    fn to_string(&self) -> String {
        String::from(match self {
            RuntimeState::Default => "default",
            RuntimeState::Test => "test",
            RuntimeState::Bench => "bench",
        })
    }
}

impl FromStr for RuntimeState {
    type Err = Error;

    fn from_str(str: &str) -> Result<Self, Self::Err> {
        match str.to_lowercase().as_str() {
            "run" | "default" => Ok(RuntimeState::Default),
            "test" => Ok(RuntimeState::Test),
            "bench" => Ok(RuntimeState::Bench),
            str => bail!("Failed parsing {str} to string"),
        }
    }
}

#[op2]
#[string]
pub fn op_runtime_state(state: &OpState) -> String {
    let runtime_state = state.borrow::<RuntimeState>();
    runtime_state.to_string()
}
