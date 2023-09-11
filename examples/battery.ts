const battery = await navigator.getBattery();

console.log(battery.charging);
console.log(battery.chargingTime);
console.log(battery.dischargingTime);
console.log(battery.level);

battery.onchargingchange = () => {
  console.log("Charging change", battery.charging);
};

battery.onchargingtimechange = () => {
  console.log("Charging time change", battery.chargingTime);
};

battery.ondischargingtimechange = () => {
  console.log("Discharging time change", battery.dischargingTime);
};

battery.onlevelchange = () => {
  console.log("Level change", battery.level);
};
