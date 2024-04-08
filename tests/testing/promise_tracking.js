const { test } = Sable.testing;

await test("Returned microtask promise", () => {
	return new Promise((r) => {
		queueMicrotask(r);
	});
})

test("Empty test", () => {

})

test("Instantly resolved promise", () => {
	return Promise.resolve();
});