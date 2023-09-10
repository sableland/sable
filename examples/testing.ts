const { test, bench } = Bueno.testing;

test("1+1=2", (ctx) => {
  ctx.equals(1 + 1, 2);
  ctx.deepEquals(1 + 1, 2);
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

test("this test fails", (ctx) => {
  ctx.assert(false);
});

test("this test has sub-tests", (ctx) => {
  ctx.test("0 = 0", (ctx) => {
    ctx.equals(0, 0);
  });

  ctx.test("zero?", (ctx) => {
    ctx.equals(0, 0);
    ctx.test("actually 1", (ctx) => {
      ctx.equals(2 ** 0, 1);
    });
    ctx.equals(0 + 0, 0);
  });
});

test("objects are equal", (ctx) => {
  const a = { hello: "world" };
  const b = { hello: "world" };

  ctx.notEquals(a, b);
  ctx.deepEquals(a, b);

  const c = {
    ["\x1b[32mHi"]: 123,
    dsfghsh: 123,
    sdjhfksdflk: 243545,
    sgkjsg: 13,
    hfjdsfghsh: 123,
    sdjhhfjfksdflk: 243545,
    sgkjhfjsg: 13,
    hello: { world: true },
    a: 5,
    b: 5,
    c: 5,
    d: 5,
    h: 5,
    g: 5,
  };
  const d = {
    dsfghsh: 123,
    sdjhfksdflk: 243545,
    sgkjsg: 13,
    hfjdsfghsh: 123,
    sdjhhfjfksdflk: 243545,
    sgkjhfjsg: 13,
    hello: { worlde: true },
    a: 5,
    b: 5,
    c: 5,
    d: 5,
    h: 5,
    g: 5,
  };

  ctx.notEquals(c, d);
  ctx.deepEquals(c, d);
});
