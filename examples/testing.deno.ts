Deno.test("name", async (t) => {
  for (let i = 0; i < 100; ++i) {
    await t.step(`${i}`, async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  }
});
