import { format } from "ext:bueno/console/formatter.js";
import { print } from "ext:bueno/console/printer.js";

const core = Bueno.core;

export class Console {
  log(...args) {
    const formatted = format(args);
    const output = print(formatted);
    core.print(output, false);
  }

  error(...args) {
    const formatted = format(args);
    const output = print(formatted);
    core.print(output, true);
  }
}

globalThis.console = new Console();
