import { isOdd } from "https://deno.land/x/is_odd@0.1.2/index.ts";

let a: number = 5;

console.log("Hello bueno", a);

console.log("My fav funcs:", Bueno.fs.readFile);

console.log("deep obj:", {
  hello: {
    world: "how are you?",
    im: {
      going: {
        even: "deeper",
      },
      fn() {
      },
      num: 5,
    },
  },
  num: 2,
  str: "HELLO",
  bool: false,
  booltrue: true,
});

console.error("Hello bueno");

console.error("is a even?", isOdd(a));
