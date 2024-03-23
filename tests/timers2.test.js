const { test } = Sable.testing;

// Fix for https://github.com/sableland/sable/issues/53:
// If after a `setTimeout` callback there are no registered timers, but some are
// registered in a microtask that will run in the next microtask checkpoint,
// those timers might never run.
test("Timers microtask bug", (ctx) => {
	return new Promise(resolve => {

		setTimeout(() => {
			queueMicrotask(() => {
				setTimeout(resolve, 0);
			});
		}, 0);

	});
});
