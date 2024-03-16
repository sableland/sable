import { defineInterfaceConstants } from "ext:sable/webidl/mod.js";

/**
 * @typedef {{
 *   bubbles?: boolean;
 *   cancelable?: boolean;
 *   composed?: boolean;
 * }} EventInit
 */

const _target = Symbol("[[target]]");
const _currentTarget = Symbol("[[currentTarget]]");
const _eventPhase = Symbol("[[eventPhase]]");
const _stopPropagation = Symbol("[[stopPropagation]]");
const _stopImmediatePropagation = Symbol("[[stopImmediatePropagation]]");
const _canceled = Symbol("[[canceled]]");
const _inPassiveListener = Symbol("[[inPassiveListener]]");
const _dispatchFlag = Symbol("[[dipatchFlag]]");
const _isTrusted = Symbol("[[isTrusted]]");

// https://dom.spec.whatwg.org/#interface-event
export class Event {
  /** @type {string} */
  #type;
  /** @type {EventTarget | null} */
  [_target] = null;
  /** @type {EventTarget | null} */
  [_currentTarget] = null;
  /** @type {0 | 1 | 2 | 3} */
  [_eventPhase] = 0; /* Event.NONE */

  /** @type {boolean} */
  [_stopPropagation] = false;
  /** @type {boolean} */
  [_stopImmediatePropagation] = false;
  /** @type {boolean} */
  [_canceled] = false;
  /** @type {boolean} */
  [_inPassiveListener] = false;
  /** @type {boolean} */
  [_dispatchFlag] = false;

  /** @type {boolean} */
  #bubbles;
  /** @type {boolean} */
  #cancelable;
  /** @type {boolean} */
  #composed;

  /** @type {boolean} */
  [_isTrusted] = false;
  /** @type {number} */
  #timeStamp;

  /**
   * @param {string} type
   * @param {EventInit} [eventInitDict]
   */
  constructor(type, eventInitDict) {
    // TODO: This is not the right timestamp, I think it should be
    // performance.now() instead.
    this.#timeStamp = Date.now();

    this.#type = String(type);
    this.#bubbles = Boolean(eventInitDict?.bubbles);
    this.#cancelable = Boolean(eventInitDict?.cancelable);
    this.#composed = Boolean(eventInitDict?.composed);
  }

  /** @returns {string} */
  get type() {
    return this.#type;
  }

  /** @returns {EventTarget | null} */
  get target() {
    return this[_target];
  }

  /** @returns {EventTarget | null} */
  get srcElement() {
    return this[_target];
  }

  /** @returns {EventTarget | null} */
  get currentTarget() {
    return this[_currentTarget];
  }

  /**
   * 
   * @returns {EventTarget[]}
   */
  composedPath() {
    // In implementations of EventTarget that don't have a DOM with a tree
    // structure, an event's internal path is either empty (in which case
    // `currentTarget` is null), or has one element which is the non-null value
    // of `currentTarget`. And since the root-of-closed-tree and slot-in-closed
    // tree are false in a non-DOM implementation, the whole algorithm can be
    // simplified to just returning `currentTarget`.
    if (this[_currentTarget] === null) {
      return [];
    }
    return [this[_currentTarget]];
  }

  get eventPhase() {
    return this[_eventPhase];
  }

  stopPropagation() {
    this[_stopPropagation] = true;
  }

  get cancelBubble() {
    return this[_stopPropagation];
  }
  set cancelBubble(value) {
    if (value) {
      this[_stopPropagation] = true;
    }
  }

  stopImmediatePropagation() {
    this[_stopPropagation] = true;
    this[_stopImmediatePropagation] = true;
  }

  get bubbles() {
    return this.#bubbles;
  }

  get cancelable() {
    return this.#cancelable;
  }

  get returnValue() {
    return this[_canceled];
  }
  set returnValue(value) {
    if (value) {
      this.preventDefault();
    }
  }

  preventDefault() {
    if (this.#cancelable && !this[_inPassiveListener]) {
      this[_canceled] = true;
    }
  }

  get defaultPrevented() {
    return this[_canceled];
  }

  get composed() {
    return this.#composed;
  }

  get isTrusted() {
    return this[_isTrusted];
  }

  get timeStamp() {
    return this.#timeStamp;
  }

  /**
   * @param {string} type
   * @param {boolean} [bubbles = false]
   * @param {boolean} [cancelable = false]
   * @returns
   */
  initEvent(type, bubbles = false, cancelable = false) {
    if (this[_dispatchFlag]) {
      return;
    }
    this[_stopPropagation] = false;
    this[_stopImmediatePropagation] = false;
    this[_canceled] = false;
    this[_isTrusted] = false;
    this[_target] = null;
    this.#type = String(type);
    this.#bubbles = Boolean(bubbles);
    this.#cancelable = Boolean(cancelable);
  }
}

defineInterfaceConstants(Event, {
  "NONE": 0,
  "CAPTURING_PHASE": 1,
  "AT_TARGET": 2,
  "BUBBLING_PHASE": 3,
});

/**
 * @typedef {EventInit & {detail?: any}} CustomEventInit
*/

export class CustomEvent extends Event {
  #detail;

  /**
   * @param {string} type
   * @param {CustomEventInit} [eventInitDict]
   */
  constructor(type, eventInitDict) {
    super(type, eventInitDict);
    this.#detail = eventInitDict?.detail ?? null;
  }

  get detail() {
    return this.#detail;
  }

  /**
   * @param {string} type
   * @param {boolean} [bubbles = false]
   * @param {boolean} [cancelable = false]
   * @param {any} [detail = null]
   * @returns
   */
  initCustomEvent(type, bubbles = false, cancelable = false, detail = null) {
    if (this[_dispatchFlag]) {
      return;
    }
    this.initEvent(type, bubbles, cancelable);
    this.#detail = detail;
  }
}

/**
 * @typedef { ((event: Event) => void) | { handleEvent(event: Event): void } } EventListener
 */

/** @typedef { {capture?: boolean} } EventListenerOptions */

/**
 * @typedef { EventListenerOptions & {
 *   passive?: boolean;
 *   once?: boolean;
 *   signal: AbortSignal;
 * } } AddEventListenerOptions
 */

/**
 * https://dom.spec.whatwg.org/#concept-flatten-options
 * @param {EventListenerOptions | boolean} options
 * @returns {boolean}
 */
function flattenCapture(options) {
  if (typeof options === "boolean") {
    return options;
  }
  return Boolean(options?.capture);
}

/**
 * https://dom.spec.whatwg.org/#event-flatten-more
 * @param {AddEventListenerOptions | boolean} options
 * @returns {{
 *   capture: boolean;
 *   passive: boolean;
 *   once: boolean;
 *   signal: AbortSignal | null;
 * }}
 */
function flattenMore(options) {
  // In the spec, `passive` not being set in `options` has a different result
  // from it being set to false. If it's not set, the resulting value will
  // depend on the default passive value
  // (https://dom.spec.whatwg.org/#default-passive-value), which depends on the
  // event name used for `addEventListener`. However, the default passive value
  // is only ever true for mouse input events. Since in this implementation it
  // will only ever be false, we instead convert it here to a boolean.

  const capture = flattenCapture(options);
  let once = false;
  let passive = false;
  let signal = null;
  if (typeof options === "object") {
    once = Boolean(options.once);
    passive = Boolean(options.passive);
    signal = (options.signal instanceof AbortSignal) ? options.signal : null;
  }
  return { capture, once, passive, signal };
}

const _listeners = Symbol("[[listeners]]");
const _dispatchCount = Symbol("[[dispatchCount]]");

export class EventTarget {
  /**
   * @type {Array<{
   *   type: string;
   *   callback: EventListener;
   *   capture: boolean;
   *   passive: boolean;
   *   once: boolean;
   *   signal: AbortSignal | null;
   *   removed: boolean;
   * }>}
   */
  [_listeners] = [];

  /**
   * This field is not in the spec, and serves to make sure that removing
   * listeners while an event dispatch is ongoing won't mess up the dispatch.
   * Elements can only be removed from [_listeners] if [_dispatchCount] === 0.
   * @type {number}
   */
  [_dispatchCount] = 0;

  /**
   * @param {string} type
   * @param {EventListener} [callback]
   * @param {AddEventListenerOptions | boolean} [options]
   */
  addEventListener(type, callback, options) {
    const listener = {
      type,
      callback: callback ?? null,
      ...flattenMore(options),
      removed: false
    };

    if (listener.signal?.aborted || listener.callback === null) {
      return;
    }

    // Do we have an equivalent event listener? If so, return.
    for (const l of this[_listeners]) {
      if (l.type === listener.type && l.callback === listener.callback && l.capture === listener.capture) {
        return;
      }
    }

    this[_listeners].push(listener);

    if (listener.signal !== null) {
      listener.signal[_addAbortSteps](() => {
        listener.removed = true;
        if (this[_dispatchCount] === 0) {
          const index = this[_listeners].indexOf(listener);
          if (index >= 0) {
            this[_listeners].splice(index, 1);
          }
        }
      });
    }
  }

  /**
   * @param {string} type
   * @param {EventListener} [callback]
   * @param {EventListenerOptions | boolean} [options]
   */
  removeEventListener(type, callback, options) {
    type = String(type);
    const capture = flattenCapture(options);
    const listenerIndex = this[_listeners].findIndex((listener) => {
      return listener.type === type && listener.callback === callback &&
        listener.capture === capture;
    });
    if (listenerIndex >= 0) {
      this[_listeners][listenerIndex].removed = true;
      if (this[_dispatchCount] === 0) {
        this[_listeners].splice(listenerIndex, 1);
      }
    }
  }

  /**
   * @param {Event} event
   * @returns {boolean}
   */
  dispatchEvent(event) {
    if (event[_dispatchFlag]) {
      // TODO: We don't yet have DOMException
      throw new Error("InvalidStateError: Trying to dispatch an event while it's already being dispatched");
    }
    event[_isTrusted] = false;
    return innerDispatch(event, this);
  }
}

/**
 * https://dom.spec.whatwg.org/#concept-event-dispatch
 * @param {Event} event
 * @param {EventTarget} target
 * @returns {boolean}
 */
function innerDispatch(event, target) {
  target[_dispatchCount]++;
  event[_dispatchFlag] = true;

  // TODO: This will have to change if/when we support customizing an
  // EventTarget's parent (see https://github.com/whatwg/dom/pull/1230).
  event[_eventPhase] = Event.AT_TARGET;
  invoke(event, target, true);  // Capturing phase
  invoke(event, target, false);  // Bubbling phase

  event[_eventPhase] = Event.NONE;
  event[_currentTarget] = null;
  event[_dispatchFlag] = false;
  event[_stopPropagation] = false;
  event[_stopImmediatePropagation] = false;

  target[_dispatchCount]--;
  if (target[_dispatchCount] < 0) {
    throw new Error("WTF");
  }
  if (target[_dispatchCount] === 0) {
    // Make sure removed event listeners are removed from the listeners array.
    let validUpTo = 0;
    for (let i = 0; i < target[_listeners].length; i++) {
      if (!target[_listeners][i].removed) {
        if (validUpTo !== i) {
          target[_listeners][validUpTo] = target[_listeners][i];
        }
        validUpTo++;
      }
    }
    target[_listeners].length = validUpTo;
  }

  return !event[_canceled];
}

/**
 * https://dom.spec.whatwg.org/#concept-event-listener-invoke
 * @param {Event} event
 * @param {EventTarget} target
 * @param {boolean} capture
 * @returns
 */
function invoke(event, target, capture) {
  event[_target] = target;
  if (event[_stopPropagation]) {
    return;
  }

  event[_currentTarget] = target;
  for (const listener of target[_listeners]) {
    if (event.type !== listener.type || listener.capture !== capture || listener.removed) {
      continue;
    }

    if (listener.once) {
      listener.removed = true;
    }
    if (listener.passive) {
      event[_inPassiveListener] = true;
    }

    try {
      if (typeof listener.callback === "function") {
        listener.callback.call(target, event);
      } else {
        listener.callback.handleEvent(event);
      }
    } catch (err) {
      // TODO: "Report the exception" (window.reportError).
      console.error(err);
    }

    event[_inPassiveListener] = false;
    if (event[_stopImmediatePropagation]) {
      return;
    }
  }
}

/**
 * Fires an event, setting its `isTrusted` field to true.
 *
 * https://dom.spec.whatwg.org/#concept-event-fire
 *
 * @param {Event} event
 * @param {EventTarget} target
 * @returns {boolean}
 */
export function fireTrustedEvent(event, target) {
  event[_isTrusted] = true;
  return innerDispatch(event, target);
}


const _addAbortSteps = Symbol("[[addAbortSteps]]");

// TODO(Im-Beast): Implement AbortSignal
class AbortSignal {
  get aborted() {
    // TODO
    return false;
  }

  /**
   * @param {() => void} callback
   */
  [_addAbortSteps](callback) {
    // TODO
  }
}
