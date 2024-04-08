const { test } = Sable.testing;

test("Returned promise leak (should fail)", () => {
	return new Promise(() => {});
})
