const core = Bueno.core;

// These are the default values for the BatteryManager object.
// https://w3c.github.io/battery/#internal-slots-0
const batteryValues = {
  charging: true,
  chargingTime: 0,
  dischargingTime: Infinity,
  level: 1,
};

class BatteryManager extends EventTarget {
  get charging() {
    return core.ops.op_battery_charging();
  }

  get chargingTime() {
    return batteryValues.chargingTime;
  }

  get dischargingTime() {
    return batteryValues.dischargingTime;
  }

  get level() {
    return core.ops.op_battery_level();
  }
}

globalThis.navigator.getBattery = async () => {
  return new BatteryManager();
};
