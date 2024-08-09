const { test } = Sable.testing;

test("Microtask promise leak (should fail)", () => {
	new Promise((r) => {
		queueMicrotask(r);
	});
})