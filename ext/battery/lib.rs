use deno_core::{error::AnyError, op2};
use battery::units::time::second;

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

#[op2(fast)]
pub fn op_battery_charging_time() -> Result<f32, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => {
            let time_to_full = battery.time_to_full();

            if time_to_full.is_none() {
                Ok(0.0)
            } else {
                let time_in_seconds = time_to_full.unwrap().get::<second>();
                Ok(time_in_seconds)
            }
        },
        _ => Ok(0.0),
    }
}

#[op2(fast)]
pub fn op_battery_discharging_time() -> Result<f32, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => {
            let time_to_full = battery.time_to_empty();

            if time_to_full.is_none() {
                Ok(f32::INFINITY)
            } else {
                let time_in_seconds = time_to_full.unwrap().get::<second>();
                Ok(time_in_seconds)
            }
        },
        _ => Ok(f32::INFINITY),
    }
}

#[op2(fast)]
pub fn op_battery_level() -> Result<f32, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => Ok(battery.state_of_charge().into()),
        _ => Ok(1.0),
    }
}