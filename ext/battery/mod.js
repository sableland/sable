const core = Bueno.core;

class BatteryManager extends EventTarget {
  get charging() {
    return core.ops.op_battery_charging();
  }

  get chargingTime() {
    return core.ops.op_battery_charging_time();
  }

  get dischargingTime() {
    return core.ops.op_battery_discharging_time();
  }

  get level() {
    return core.ops.op_battery_level();
  }
}

globalThis.navigator.getBattery = async () => {
  return new BatteryManager();
};
