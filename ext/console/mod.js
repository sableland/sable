import { format } from "ext:bueno/console/formatter.js";
import { print } from "ext:bueno/console/printer.js";

const core = Bueno.core;

export class Console {
  log(...args) {
    const formatted = format(args);
    print(formatted);
  }

  error(...data) {}
}

globalThis.console = new Console();
