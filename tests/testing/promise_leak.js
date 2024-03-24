const { test } = Sable.testing;

test("Promise leak (should fail)", () => {
	new Promise(() => {});
})