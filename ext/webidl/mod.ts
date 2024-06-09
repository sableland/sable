export * from "ext:sable/webidl/numbers.js";
export * from "ext:sable/webidl/strings.ts";
export * from "ext:sable/webidl/objects.ts";
export * from "ext:sable/webidl/functions.ts";

/**
 * Defines WebIDL constants on an interface, namespace, etc.
 *
 * https://webidl.spec.whatwg.org/#define-the-constants
 *
 * @param {object | object[]} targets - The interface, prototype, etc.
 * on which to define the constants. Can be an array, to define
 * constants on an interface's constructor and prototype at the same
 * time.
 * @param {Record<string, any>} constants
 */
export function defineConstants(targets, constants) {
  /** @type {PropertyDescriptorMap} */
  const descriptors = {};
  for (const [constantName, value] of Object.entries(constants)) {
    descriptors[constantName] = {
      writable: false,
      enumerable: true,
      configurable: false,
      value,
    };
  }

  const targetArray = Array.isArray(targets) ? targets : [targets];
  for (const target of targetArray) {
    Object.defineProperties(target, descriptors);
  }
}

/**
 * Defines WebIDL constants on an interface. This function handles
 * both the constructor and the prototype.
 *
 * https://webidl.spec.whatwg.org/#define-the-constants
 *
 * @param { {prototype: object} } target - A WebIDL interface
 * constructor.
 * @param {Record<string, any>} constants
 */
export function defineInterfaceConstants(target, constants) {
  defineConstants([target, target.prototype], constants);
}
