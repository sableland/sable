export function toNumber(value) {
  return Number(value);
}

export function correctZeroSign(value) {
  if (value === -0) return 0;
  return value;
}

export * from "ext:bueno/webidl/integers.js";
