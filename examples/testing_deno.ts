import {
  assert,
  assertEquals,
  assertNotEquals,
  assertNotStrictEquals,
  assertStrictEquals,
} from "https://deno.land/std/assert/mod.ts";

Deno.test("1+1=2", () => {
  assertStrictEquals(1 + 1, 2);
  assertEquals(1 + 1, 2);
});

Deno.test("objects are different", () => {
  const a = { hello: "worl" };
  const b = { hello: { world: true } };

  assertNotEquals(a, b);
});

Deno.test("maps are equal", () => {
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

  assertNotStrictEquals(a, b);
  assertEquals(a, b);
});

Deno.test("maps are not equal", () => {
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

  assertNotStrictEquals(a, b);
  assertNotEquals(a, b);
});

Deno.test("sets are equal", () => {
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

  assertNotStrictEquals(a, b);
  assertEquals(a, b);
});

Deno.test("sets are not equal", () => {
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

  assertNotStrictEquals(a, b);
  assertNotEquals(a, b);
});

Deno.test("this test fails", () => {
  // assert(false);
});

Deno.test("this test has sub-tests", async (t) => {
  await t.step("0 = 0", () => {
    assertStrictEquals(0, 0);
  });

  await t.step("zero?", async (t) => {
    assertStrictEquals(0, 0);
    await t.step("actually 1", () => {
      assertStrictEquals(2 ** 0, 1);
    });
    assertStrictEquals(0 + 0, 0);
  });
});

Deno.test("objects are equal", () => {
  const a = { hello: "world" };
  const b = { hello: "world" };

  assertNotStrictEquals(a, b);
  for (let i = 0; i < 100_000; ++i) {
    const g = { hello: "world" + i * (1 / 2) ** 2 };
    const h = { hello: "world" + i * (1 / 2) ** 2 };
    assertEquals(g, h);
  }

  const c = {
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

  class Dog {
    constructor(x) {
      Object.assign(this, x);
    }
  }

  const d = new Dog({
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
  });

  assertNotStrictEquals(c, d);
  assertEquals(c, d);
});
