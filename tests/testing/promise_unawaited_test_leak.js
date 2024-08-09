const { test } = Sable.testing;

test("A", () => Promise.resolve(1));

await test("B", (ctx) => {
	ctx.equals(1, 1);
})