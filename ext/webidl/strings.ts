/**
 * https://tc39.es/ecma262/multipage/abstract-operations.html#sec-tostring
 */
export function toString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  } else if (typeof value === "symbol") {
    throw new TypeError("Symbol cannot be converted to a string");
  } else if (typeof value === "number" || typeof value === "bigint") {
    return value.toString(10);
  } else if (typeof value !== "object") {
    return value.toString();
  }

  return String(value);
}

/**
 * https://webidl.spec.whatwg.org/#js-DOMString
 */
export function toDOMString(
  value: unknown,
  legacyNullToEmptyString = false,
): string {
  if (legacyNullToEmptyString && value === null) {
    return "";
  }
  return toString(value);
}
