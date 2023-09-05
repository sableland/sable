import { Formatter } from "ext:bueno/console/formatter.js";
import { Printer, LogLevel } from "ext:bueno/console/printer.js";

const core = Bueno.core;

const defaultPrinterConfig = {
  indent: 2,
  maxDepth: 4,
  maxLineWidth: 80,
  maxItemsPerLine: 5,
  usefulFormatting: true,
};

const genericFormattingConfig = {
  usefulFormatting: false,
};

export class Console {
  #formatter = new Formatter();

  //#region Logging
  #logPrinter = new Printer(LogLevel.log, defaultPrinterConfig);
  log(...args) {
    const printer = this.#logPrinter;
    printer.print(this.#formatter.format(args, printer));
  }

  #infoPrinter = new Printer(LogLevel.info, defaultPrinterConfig);
  info(...args) {
    const printer = this.#infoPrinter;
    printer.print(this.#formatter.format(args, printer));
  }

  #debugPrinter = new Printer(LogLevel.debug, defaultPrinterConfig);
  debug(...args) {
    const printer = this.#debugPrinter;
    printer.print(this.#formatter.format(args, printer));
  }

  #warnPrinter = new Printer(LogLevel.warn, defaultPrinterConfig);
  warn(...args) {
    const printer = this.#warnPrinter;
    printer.print(this.#formatter.format(args, printer));
  }

  #dirxmlPrinter = new Printer(LogLevel.dirxml, defaultPrinterConfig);
  dirxml(...args) {
    const printer = this.#dirxmlPrinter;
    printer.print(this.#formatter.format(args, printer));
  }

  #dirPrinter = new Printer(LogLevel.dir, genericFormattingConfig);
  dir(arg, _options) {
    const printer = this.#dirPrinter;
    printer.print([arg]);
  }

  #errorPrinter = new Printer(LogLevel.error, defaultPrinterConfig);
  error(...args) {
    const printer = this.#errorPrinter;
    printer.print(this.#formatter.format(args, printer));
  }

  #tracePrinter = new Printer(LogLevel.trace, defaultPrinterConfig);
  trace(...args) {
    const printer = this.#tracePrinter;

    const error = {
      name: "Trace",
      message: printer.print(this.#formatter.format(args, printer)).trim(),
    };
    Error.captureStackTrace(error, this.trace);

    core.print(error.stack + "\n", false);
  }

  #assertPrinter = new Printer(LogLevel.assert, defaultPrinterConfig);
  assert(condition, ...args) {
    if (condition) return;
    const printer = this.#assertPrinter;
    const formatted = this.#formatter.format(args, printer);
    // Prepend "Assertion failed" message
    formatted.unshift("Assertion failed:");
    printer.print(formatted);
  }

  table() {}

  clear() {
    core.print("\x1b[1;1H\x1b[0J", false);
  }
  //#endregion

  //#region Counting
  #counters = {};

  #countPrinter = new Printer(LogLevel.count, genericFormattingConfig);
  count(label) {
    label = label ? String(label) : "default";

    this.#counters[label] ??= 0;
    const value = ++this.#counters[label];

    this.#countPrinter.print([`${label}: ${value}`]);
  }

  #countResetPrinter = new Printer(
    LogLevel.countReset,
    genericFormattingConfig
  );
  countReset(label) {
    label = label ? String(label) : "default";

    if (label in this.#counters) {
      this.#counters[label] &&= 0;
    } else {
      this.#countResetPrinter.print([`Count for '${label}' doesn't exist`]);
    }
  }
  //#endregion

  //#region Timing
  #timerTable = {};

  #timePrinter = new Printer(LogLevel.time, genericFormattingConfig);
  time(label) {
    label = label ? String(label) : "default";

    if (label in this.#timerTable) {
      this.#timePrinter.print([`Timer '${label}' already exists`]);
    } else {
      this.#timerTable[label] = Date.now();
    }
  }

  #timeLogPrinter = new Printer(LogLevel.timeLog, defaultPrinterConfig);
  timeLog(label, ...args) {
    label = label ? String(label) : "default";

    const printer = this.#timeLogPrinter;

    if (label in this.#timerTable) {
      const duration = Date.now() - this.#timerTable[label];
      args.unshift(`${label}: ${duration} ms`);
      printer.print(args);
    } else {
      printer.print([`Timer '${label}' doesn't exist`]);
    }
  }

  #timeEndPrinter = new Printer(LogLevel.timeEnd, genericFormattingConfig);
  timeEnd(label) {
    label = label ? String(label) : "default";

    const printer = this.#timeEndPrinter;

    if (label in this.#timerTable) {
      const duration = Date.now() - this.#timerTable[label];
      printer.print([`${label}: ${duration} ms`]);
      delete this.#timerTable[label];
    } else {
      printer.print([`Timer '${label}' doesn't exist`]);
    }
  }
  //#endregion
}

globalThis.console = new Console();
