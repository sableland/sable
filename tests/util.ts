class AssertionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

/** Make an assertion, error will be thrown if `expr` does not have truthy value. */
export function assert(value: unknown, message?: string) {
  if(!value) {
    throw new AssertionError(message)
  }
}

export function assertEquals<T>(a: T, b: T, message?: string) {
  if(typeof a !== "function" && (a === null || typeof a !== "object")) {
    if(a !== b) {
      throw new AssertionError(message)
    }
  }


  if(a instanceof Uint8Array && b instanceof Uint8Array) {
    const equal = a.length === b.length && a.every((v, i) => v === b[i]);
    if(!equal) {
      throw new AssertionError(message)
    }
  }
}