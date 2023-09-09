const { test, bench } = Bueno.testing;

test("1+1=2", (ctx) => {
  ctx.equals(1 + 1, 2);
  ctx.deepEquals(1 + 1, 2);
});

test("objects are equal", (ctx) => {
  const a = { hello: "world" };
  const b = { hello: "world" };

  ctx.notEquals(a, b);
  ctx.deepEquals(a, b);

  const c = { hello: { world: true } };
  const d = { hello: { world: true } };

  ctx.notEquals(c, d);
  ctx.deepEquals(c, d);
});

test("objects are different", (ctx) => {
  const a = { hello: "worl" };
  const b = { hello: { world: true } };

  ctx.notDeepEquals(a, b);
});

test("maps are equal", (ctx) => {
  const a = new Map([
    ["key", "value"],
    ["k2", "v2"],
    ["dog", "cat"],
  ]);

  const b = new Map([
    ["key", "value"],
    ["k2", "v2"],
    ["dog", "cat"],
  ]);

  ctx.notEquals(a, b);
  ctx.deepEquals(a, b);
});

test("maps are not equal", (ctx) => {
  const a = new Map([
    ["key", "alue"],
    ["k2", "k0"],
    ["dog", "cat"],
  ]);

  const b = new Map([
    ["key", "value"],
    ["k2", "v2"],
    ["dog", "wow"],
  ]);

  ctx.notEquals(a, b);
  ctx.notDeepEquals(a, b);
});

test("sets are equal", (ctx) => {
  const a = new Set([
    "key",
    "value",
    "k2",
    "v2",
    "dog",
    "cat",
  ]);

  const b = new Set([
    "key",
    "value",
    "k2",
    "v2",
    "dog",
    "cat",
  ]);

  ctx.notEquals(a, b);
  ctx.deepEquals(a, b);
});

test("sets are not equal", (ctx) => {
  const a = new Set([
    "key",
    "alue",
    "k2",
    "k0",
    "dog",
    "cat",
  ]);

  const b = new Set([
    "key",
    "value",
    "k2",
    "v2",
    "dog",
    "wow",
  ]);

  ctx.notEquals(a, b);
  ctx.notDeepEquals(a, b);
});
