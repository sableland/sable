const battery = await navigator.getBattery();

console.log(battery.charging);
console.log(battery.chargingTime);
console.log(battery.dischargingTime);
console.log(battery.level);
