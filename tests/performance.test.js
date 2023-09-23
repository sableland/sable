const { test } = Bueno.testing;

test("Performance API", (ctx) => {
  ctx.almostEquals(Date.now() - performance.timeOrigin, performance.now(), 4);
});
