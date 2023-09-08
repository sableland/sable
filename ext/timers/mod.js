// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
import { toLong } from "ext:bueno/webidl/mod.js";

const core = Bueno.core;

let nestingLevel = 0;

// Error which throws when someone tries to use setTimeout(code, ...) or setInterval(code, ...) syntax
// It's not supported simply because its cursed
class UnsupportedSetTimerCodeError extends Error {
  /**
   * @param {"Timeout" | "Interval"} type
   */
  constructor(type) {
    super(
      `set${type}(code, ...) is not supported.\nIf you can't generate the code statically please consider using new Function() instead`
    );
  }
}

// Wrap timer's callback with a function that checks whether value returned by op_queue_timer is true
function wrapTimerCallback(callback, currentNesting, args) {
  return (value) => {
    if (value === true) {
      nestingLevel = currentNesting;
      callback.apply(globalThis, args);
      nestingLevel = 0;
    }
  };
}

/**
 * Queue timer depending on its delay
 * Deferred (0ms) -> at the end of event loop
 * Time -> after specified delay
 * @param {number} id
 * @param {number} delay
 */
function queueTimer(id, delay) {
  if (delay === 0) {
    return core.ops.op_queue_timer_deferred(id, delay);
  } else {
    return core.ops.op_queue_timer(id, delay);
  }
}

/**
 * Run asynchronous while loop which queues timer (interval) with given id
 * and calls given callback
 *
 * @param {number} id
 * @param {number} interval
 * @param {number} currentNesting
 * @param {(...args: any[]) => any} callback
 * @param {...any} args
 */
async function runInterval(id, interval, currentNesting, callback, args) {
  while (await queueTimer(id, interval)) {
    nestingLevel = currentNesting;
    callback.apply(globalThis, args);
    nestingLevel = 0;
  }
}

/**
 * @param {(...args: any[]) => any} callback
 * @param {number} timeout
 * @param  {...any} args
 * @returns timeout id
 */
function setTimeout(callback, timeout = 0, ...args) {
  if (typeof callback !== "function") {
    throw new UnsupportedSetTimerCodeError("Timeout");
  }

  timeout = toLong(timeout);

  const id = core.ops.op_create_timer();

  const currentNesting = nestingLevel + 1;
  if (currentNesting > 5 && timeout < 4) {
    timeout = 4;
  }

  callback = wrapTimerCallback(callback, currentNesting, args);
  queueTimer(id, timeout).then(callback);

  return id;
}

/**
 * @param {(...args: any[]) => any} callback
 * @param {number} interval
 * @param  {...any} args
 * @returns interval id
 */
function setInterval(callback, interval = 0, ...args) {
  if (typeof callback !== "function") {
    throw new UnsupportedSetTimerCodeError("Interval");
  }

  interval = toLong(interval);

  const currentNesting = nestingLevel + 1;
  if (currentNesting > 5 && interval < 4) {
    interval = 4;
  }

  const id = core.ops.op_create_timer();
  runInterval(id, interval, currentNesting, callback, args);
  return id;
}

function clearTimeout(id) {
  core.ops.op_clear_timer(id);
}

function clearInterval(id) {
  core.ops.op_clear_timer(id);
}

globalThis.setTimeout = setTimeout;
globalThis.setInterval = setInterval;
globalThis.clearTimeout = clearTimeout;
globalThis.clearInterval = clearInterval;
