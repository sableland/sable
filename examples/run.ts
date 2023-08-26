let a: number = 5;

// Console log tests
console.log("Hello bueno", a);
console.error("Hello bueno");

// File system tests
await Bueno.fs.writeTextFile(
  "./async.txt",
  "hello from your file system async",
);
console.log(await Bueno.fs.readTextFile("./async.txt"));
await Bueno.fs.remove("./async.txt");

Bueno.fs.writeTextFileSync("./sync.txt", "hello from your file system sync");
console.log(Bueno.fs.readTextFileSync("./sync.txt"));
Bueno.fs.removeSync("./sync.txt");
