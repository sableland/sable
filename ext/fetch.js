import "ext:bueno/bueno.js";

globalThis.fetch = (...args) => {
  return Bueno.fetch(args[0]);
};
