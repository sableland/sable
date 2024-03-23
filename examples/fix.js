const { test } = Sable.testing;

await test("a", () => {
    return new Promise(resolve => {
        queueMicrotask(() => {
					resolve()
				});
    });
});

test("b", () => { });

test("c", () => {
	new Promise(() => {});
})