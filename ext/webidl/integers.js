import { correctZeroSign, toNumber } from "ext:sable/webidl/numbers.js";

export const IDL_TYPE = {
	clamp: "clamp",
	enforceRange: "enforceRange",
};

/**
 * https://webidl.spec.whatwg.org/#abstract-opdef-integerpart
 * @param {*} value
 * @returns
 */
export function toIntegerPart(value) {
	return Math.trunc(value);
}

/**
 * https://webidl.spec.whatwg.org/#abstract-opdef-converttoint
 * @param {*} value
 * @param {number} bitLength
 * @param {boolean} signed
 * @param {"clamp" | "enforceRange" | undefined} idl
 * @returns
 */
export function toInt(value, bitLength, signed = false, idl = undefined) {
	let upperBound;
	let lowerBound;

	if (bitLength === 64) {
		bitLength = 53;
	}

	const maxPower = 2 ** bitLength;
	const base = signed ? 2 ** (bitLength - 1) : maxPower - 1;
	lowerBound = signed ? -base : 0;
	upperBound = base;

	let converted = toNumber(value);
	converted = correctZeroSign(value);

	switch (idl) {
		case IDL_TYPE.enforceRange: {
			if (Number.isNaN(converted) || !Number.isFinite(converted)) {
				throw new TypeError("value isn't in range");
			}

			converted = toIntegerPart(converted);

			if (converted < lowerBound || converted > upperBound) {
				throw new TypeError("value isn't in range");
			}

			return converted;
		}
		case IDL_TYPE.clamp: {
			converted = Math.min(Math.max(converted, lowerBound), upperBound);
			converted = correctZeroSign(Math.round(converted));
			return converted;
		}
		default: {
			converted = toIntegerPart(converted);
			converted = converted % maxPower;

			if (signed && converted > upperBound) {
				converted -= maxPower;
			}

			return converted;
		}
	}
}

/**
 * https://webidl.spec.whatwg.org/#idl-long
 * @param {*} value
 * @returns
 */
export function toLong(value) {
	return toInt(value, 32, true);
}
