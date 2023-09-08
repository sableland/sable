const start = performance.now();
console.log(start);

for (let i = 0; i < 100_000; ++i) {
  Math.random();
}

const end = performance.now();
console.log(end);
console.log("Elapsed:", end - start);

console.log("ORIGIN:", performance.timeOrigin);
console.log(
  "date-performance.timeOrigin vs performance.now",
  Date.now() - performance.timeOrigin,
  performance.now(),
);

console.log(Date.now());
