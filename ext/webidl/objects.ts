export function illegalConstructor(message = "") {
  message &&= message + " ";
  throw new TypeError(`${message}Illegal constructor`);
}

// https://github.com/denoland/deno/blob/31154ff95899166a2535fc859c1fca2cbf19d422/ext/webidl/00_webidl.js#L1008
const brand = Symbol("[[webidl.brand]]");
/** Creates branded instance of given class */
type ClassType = new (...args) => void;
export function createBranded<T extends ClassType>(type: T): InstanceType<T> {
  const instance = Object.create(type.prototype);
  instance[brand] = type;
  return instance;
}

export function brandedCheck<T extends ClassType>(
  instance: InstanceType<T>,
  type: T,
  message = "",
): void {
  if (instance[brand] !== type) {
    message &&= message + " ";
    throw new TypeError(`${message}Invalid invocation`);
  }
}
