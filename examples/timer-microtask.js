const { test } = Sable.testing;

test("Timers microtask bug", (ctx) => {
	return new Promise(resolve => {
		setTimeout(() => {
			queueMicrotask(() => {
				setTimeout(resolve, 0);
			});
		}, 0);
	});
});