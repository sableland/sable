const { test } = Sable.testing;

test("Crypto API - Crypto is unconstructable", (ctx) => {
  ctx.throws(() => new Crypto(), TypeError);
});


test("Crypto API - randomUUID", (ctx) => {
  ctx.assert(typeof crypto.randomUUID() === "string");
	ctx.assert(crypto.randomUUID().length === 36);
});
