const { test } = Sable.testing;

test("Crypto API - Crypto is unconstructable", (ctx) => {
  ctx.throws(() => new Crypto(), TypeError);
});


test("Crypto API - randomUUID", (ctx) => {
  ctx.equals(typeof crypto.randomUUID(), "string");
	ctx.equals(crypto.randomUUID().length, 36);
});
