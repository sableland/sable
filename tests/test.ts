import { assertEquals } from "./util.ts";

// Testing: writeFile / readFile / remove
{
  const buffer = Uint8Array.of(1, 2, 3, 4)
  await Bueno.fs.writeFile("async.bin", buffer);
  assertEquals(buffer, await Bueno.fs.readFile("async.bin"), "writeFile/readFile error")
  await Bueno.fs.remove("./async.bin");
}

// Testing: writeFileSync / readFileSync / removeSync
{
  const buffer = Uint8Array.of(1, 2, 3, 4)
  Bueno.fs.writeFileSync("sync.bin", buffer);
  assertEquals(buffer, Bueno.fs.readFileSync("sync.bin"), "writeFileSync/readFileSync error")
  Bueno.fs.removeSync("sync.bin");
}

// Testing: writeTextFile / readTextFile / remove
{
  const text = "hello from your file system async"
  await Bueno.fs.writeTextFile("async.txt", text);
  assertEquals(text, await Bueno.fs.readTextFile("async.txt"), "writeTextFile/readTextFile error")
  await Bueno.fs.remove("./async.txt");
}

// Testing: writeTextFileSync / readTextFileSync / removeSync
{
  const text = "hello from your file system async"
  Bueno.fs.writeTextFileSync("sync.txt", text);
  assertEquals(text, Bueno.fs.readTextFileSync("sync.txt"), "writeTextFileSync/readTextFileSync error")
  Bueno.fs.removeSync("sync.txt");
}