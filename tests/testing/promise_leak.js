const { test } = Sable.testing;

await test("Promise leak (should fail)", () => {
	new Promise(() => {});
})