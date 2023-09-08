import { toLong } from "ext:bueno/webidl/mod.js";

const core = Bueno.core;

let nestingLevel = 0;

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

function wrapTimerCallback(callback, currentNesting, args) {
  return (value) => {
    if (value === true) {
      nestingLevel = currentNesting;
      callback.apply(globalThis, args);
      nestingLevel = 0;
    }
  };
}

function queueTimer(id, delay) {
  if (delay === 0) {
    return core.ops.op_queue_timer_deferred(id, delay);
  } else {
    return core.ops.op_queue_timer(id, delay);
  }
}

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

async function runInterval(id, interval, currentNesting, callback, args) {
  while (await queueTimer(id, interval)) {
    nestingLevel = currentNesting;
    callback.apply(globalThis, args);
    nestingLevel = 0;
  }
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
