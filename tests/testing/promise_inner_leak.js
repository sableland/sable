const { test } = Sable.testing;

await test("Inner promise leak (should fail)", () => {
  new Promise(() => {});
  return Promise.resolve(1);
});