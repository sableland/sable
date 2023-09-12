use battery::units::time::second;
use deno_core::{error::AnyError, op2};

const DEFAULT_BATTERY_CHARGING: bool = true;
const DEFAULT_BATTERY_CHARGING_TIME: f32 = 0.0;
const DEFAULT_BATTERY_DISCHARGING_TIME: f32 = f32::INFINITY;
const DEFAULT_BATTERY_LEVEL: f32 = 1.0;

// If there's an error, we return the default values for the BatteryManager object.
// https://w3c.github.io/battery/#internal-slots-0

#[op2(fast)]
pub fn op_battery_charging() -> Result<bool, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => Ok(battery.state() == battery::State::Charging),
        _ => Ok(DEFAULT_BATTERY_CHARGING),
    }
}

#[op2(fast)]
pub fn op_battery_charging_time() -> Result<f32, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => {
            if let Some(time) = battery.time_to_full() {
                Ok(time.get::<second>())
            } else {
                Ok(DEFAULT_BATTERY_CHARGING_TIME)
            }
        }
        _ => Ok(DEFAULT_BATTERY_CHARGING_TIME),
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
                Ok(DEFAULT_BATTERY_DISCHARGING_TIME)
            } else {
                let time_in_seconds = time_to_full.unwrap().get::<second>();
                Ok(time_in_seconds)
            }
        }
        _ => Ok(DEFAULT_BATTERY_DISCHARGING_TIME),
    }
}

#[op2(fast)]
pub fn op_battery_level() -> Result<f32, AnyError> {
    let manager = battery::Manager::new()?;
    let mut batteries = manager.batteries()?;

    match batteries.next() {
        Some(Ok(battery)) => Ok(battery.state_of_charge().into()),
        _ => Ok(DEFAULT_BATTERY_LEVEL),
    }
}
