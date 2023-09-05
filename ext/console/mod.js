import { Formatter } from "ext:bueno/console/formatter.js";
import { Printer, LogLevel } from "ext:bueno/console/printer.js";

const core = Bueno.core;

const defaultPrinterConfig = { indent: 2, maxDepth: 4 };

export class Console {
  #formatter = new Formatter();
  #logPrinter = new Printer(LogLevel.log, defaultPrinterConfig);
  #errorPrinter = new Printer(LogLevel.error, defaultPrinterConfig);

  log(...args) {
    const printer = this.#logPrinter;

    const formatted = this.#formatter.format(args, printer);
    const output = printer.print(formatted);
    core.print(output, false);
  }

  error(...args) {
    const formatted = this.#formatter.format(args);
    const output = this.#errorPrinter.print(formatted);
    core.print(output, false);
  }
}

globalThis.console = new Console();
