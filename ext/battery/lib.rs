use deno_core::{error::AnyError, op2};

// If there's an error, we return the default values for the BatteryManager object.
// https://w3c.github.io/battery/#internal-slots-0

#[op2(fast)]
pub fn op_battery_charging() -> Result<bool, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => Ok(battery.state() == battery::State::Charging),
        _ => Ok(true),
    }
}

// #[op2(fast)]
// pub fn op_battery_charging_time() -> Result<f32, AnyError> {
//     let manager = battery::Manager::new()?;
//     let mut batteries = manager.batteries()?;

//     match batteries.next() {
//         Some(Ok(battery)) => {
//           Ok(battery.time_to_full().unwrap_or(Time::new::<_>(0.0)).value)
//         },
//         _ => Ok(0.0),
//     }
// }

#[op2(fast)]
pub fn op_battery_level() -> Result<f32, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => Ok(battery.state_of_charge().into()),
        _ => Ok(1.0),
    }
}