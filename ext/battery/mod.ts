import {
	op_battery_charging,
	op_battery_charging_time,
	op_battery_discharging_time,
	op_battery_level,
} from "ext:core/ops";

class BatteryManager extends EventTarget {
	get charging() {
		return op_battery_charging();
	}

	get chargingTime() {
		return op_battery_charging_time();
	}

	get dischargingTime() {
		return op_battery_discharging_time();
	}

	get level() {
		return op_battery_level();
	}
}

let batteryManager;

globalThis.navigator.getBattery = async () => {
	if (!batteryManager) {
		batteryManager = new BatteryManager();

		let oldCharging = batteryManager.charging;
		let oldChargingTime = batteryManager.chargingTime;
		let oldDischargingTime = batteryManager.dischargingTime;
		let oldLevel = batteryManager.level;

		setInterval(() => {
			const newCharging = batteryManager.charging;
			const newChargingTime = batteryManager.chargingTime;
			const newDischargingTime = batteryManager.dischargingTime;
			const newLevel = batteryManager.level;

			if (oldCharging !== newCharging) {
				batteryManager?.onchargingchange();
				batteryManager.dispatchEvent(new Event("chargingchange"));
			}
			if (oldChargingTime !== newChargingTime) {
				batteryManager?.onchargingtimechange();
				batteryManager.dispatchEvent(new Event("chargingtimechange"));
			}
			if (oldDischargingTime !== newDischargingTime) {
				batteryManager?.ondischargingtimechange();
				batteryManager.dispatchEvent(new Event("dischargingtimechange"));
			}
			if (oldLevel !== newLevel) {
				batteryManager?.onlevelchange();
				batteryManager.dispatchEvent(new Event("levelchange"));
			}
			oldCharging = newCharging;
			oldChargingTime = newChargingTime;
			oldDischargingTime = newDischargingTime;
			oldLevel = newLevel;
		}, 1000);
	}
	return batteryManager;
};
