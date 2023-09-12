export class Event {
  /** @type {string} */
  #type;
  /** @type {boolean} */
  #bubbles;
  /** @type {boolean} */
  #cancelable;
  /** @type {boolean} */
  #composed;
  /** @type {boolean} */
  #defaultPrevented;

  /**
   * @param {string} type
   * @param {EventInit} eventInitDict
   */
  constructor(type, eventInitDict = {}) {
    this.#type = type;
    this.#bubbles = eventInitDict.bubbles ?? false;
    this.#cancelable = eventInitDict.cancelable ?? false;
    this.#composed = eventInitDict.composed ?? false;
  }

  get type() {
    return this.#type;
  }

  // Everything below this is essentially nonsense stubs
  // Most of these have no relevance in a runtime with no DOM
  composedPath() {
    return [];
  }

  NONE = 0;
  CAPTURING_PHASE = 1;
  AT_TARGET = 2;
  BUBBLING_PHASE = 3;

  static NONE = 0;
  static CAPTURING_PHASE = 1;
  static AT_TARGET = 2;
  static BUBBLING_PHASE = 3;

  get eventPhase() {
    return this.NONE;
  }

  stopPropagation() {}
  cancelBubble() {} // legacy - alias of stopPropagation()
  stopImmediatePropagation() {}

  get bubbles() {
    return this.#bubbles;
  }

  get cancelable() {
    return this.#cancelable;
  }

  get returnValue() {
    return false; // legacy
  }

  preventDefault() {
    this.#defaultPrevented = true;
  }

  get defaultPrevented() {
    return this.#defaultPrevented;
  }

  get composed() {
    return this.#composed;
  }

  get isTrusted() {
    return false;
  }

  get timeStamp() {
    // TODO(lino-levan): make this an attribute on the class that is set to "how long program has been running"
    return 0;
  }

  // legacy
  initEvent(type, bubbles = false, cancelable = false) {
    this.#type = type;
    this.#bubbles = bubbles;
    this.#cancelable = cancelable;
  }
}

export class CustomEvent extends Event {
  #detail;

  /**
   * @param {string} type
   * @param {CustomEventInit} eventInitDict
   */
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.#detail = eventInitDict.detail;
  }

  get detail() {
    return this.#detail;
  }

  // legacy
  initCustomEvent(type, bubbles = false, cancelable = false, detail = null) {
    super.initEvent(type, bubbles, cancelable);
    this.#detail = detail;
  }
}

// TODO(lino-levan): Handle options
// TODO(lino-levan): Add AbortController / AbortSignal
export class EventTarget {
  /** @type {Record<string, (event: Event)=>void>} */
  #events = {};

  /**
   * @param {string} type
   * @param {null | (event: Event)=>void | { handleEvent: (event: Event)=>void }} callback
   * @param {boolean | {capture?: boolean, once?: boolean, passive?: boolean, signal?: AbortSignal}} options
   */
  addEventListener(type, callback, options) {
    if (!callback) return;

    if (!(type in events)) {
      events[type] = [];
    }

    if (!events[type].includes(callback)) {
      if (typeof callback === "function") {
        events[type].push(callback);
      } else if (typeof callback?.handleEvent === "function") {
        events[type].push(callback.handleEvent);
      }
    }
  }

  /**
   * @param {string} type
   * @param {null | (event: Event)=>void | { handleEvent: (event: Event)=>void }} callback
   * @param {boolean | {capture?: boolean}} options
   */
  removeEventListener(type, callback, options) {
    if (!callback) return;

    if (!(type in events)) {
      return;
    }

    const index = events[type].indexOf(callback);

    if (index !== -1) {
      events[type].splice(index, 1);
    }
  }

  /**
   * @param {Event} event
   */
  dispatchEvent(event) {
    if (event.type in this.#events) {
      for (const callback of this.#events[event.type]) {
        callback(event);
      }
    }
  }
}
