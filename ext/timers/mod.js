import { op_timers_sleep, op_create_timer, op_close } from "ext:core/ops";

// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
import { toLong } from "ext:sable/webidl/mod.js";

const activeTimers = new Map();

let nextId = 1;
let nestingLevel = 0;
let isTimerLoopRunning = false;

// Error which throws when someone tries to use setTimeout(code, ...) or setInterval(code, ...) syntax
// It's not supported simply because its cursed
class UnsupportedSetTimerCodeError extends Error {
	/**
	 * @param {"Timeout" | "Interval"} type
	 */
	constructor(type) {
		super(
			`set${type}(code, ...) is not supported.\nIf you can't generate the code statically please consider using new Function() instead`,
		);
	}
}

async function runTimerLoop() {
	if (isTimerLoopRunning) {
		throw new Error("WTF");
	}
	isTimerLoopRunning = true;

	while (true) {
		const timerId = await op_timers_sleep();
		if (timerId === null) {
			break;
		}

		const timer = activeTimers.get(timerId);
		nestingLevel = timer.nestingLevel;
		// TODO: Handle exceptions
		timer.callback.apply(globalThis, timer.args);
		nestingLevel = 0;

		// Free the TimerHandle resource
		op_close(timer.cancelRid);

		if (timer.isInterval) {
			timer.nestingLevel++;
			const delay = Math.max(timer.delay, timer.nestingLevel > 5 ? 4 : 0);
			timer.cancelRid = op_create_timer(delay, timerId);
		} else {
			activeTimers.delete(timerId);
		}
	}

	isTimerLoopRunning = false;
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

	const id = nextId;
	nextId++;

	const currentNesting = nestingLevel + 1;
	const delay = Math.max(timeout, currentNesting > 5 ? 4 : 0);
	const cancelRid = op_create_timer(delay, id);

	activeTimers.set(id, {
		nestingLevel: currentNesting,
		callback,
		args,
		cancelRid,
		isInterval: false,
	});

	if (!isTimerLoopRunning) {
		runTimerLoop();
	}

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

	const id = nextId;
	nextId++;

	const currentNesting = nestingLevel + 1;
	const delay = Math.max(interval, currentNesting > 5 ? 4 : 0);
	const cancelRid = op_create_timer(delay, id);

	activeTimers.set(id, {
		nestingLevel: currentNesting,
		callback,
		args,
		cancelRid,
		isInterval: true,
		delay: interval,
	});

	if (!isTimerLoopRunning) {
		runTimerLoop();
	}

	return id;
}

function clearTimeout(id) {
	const timer = activeTimers.get(id);
	if (timer) {
		op_close(timer.cancelRid);
		activeTimers.delete(id);
	}
}

function clearInterval(id) {
	clearTimeout(id);
}

globalThis.setTimeout = setTimeout;
globalThis.setInterval = setInterval;
globalThis.clearTimeout = clearTimeout;
globalThis.clearInterval = clearInterval;
