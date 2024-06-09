export function requiredArgumentsCheck(
  actual: number,
  expected: number,
  message = "",
) {
  if (actual < expected) {
    message &&= message + " ";
    throw new TypeError(
      `${message}At least ${expected} arguments are required, but only ${actual} are present.`,
    );
  }
}
