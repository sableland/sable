// https://tc39.es/ecma262/multipage/abstract-operations.html#sec-tonumber
export function toNumber(value) {
	if (typeof value === "bigint") {
		throw new TypeError("BigInt cannot be converted to a number");
	}
	return Number(value);
}

/**
 * If value is -0 returns 0 otherwise returns given parameter
 * @param {number} value
 * @returns
 */
export function correctZeroSign(value) {
	if (value === -0) return 0;
	return value;
}

export * from "ext:sable/webidl/integers.js";
