import { Formatter } from "ext:bueno/console/formatter.js";
import { LogLevel, Printer } from "ext:bueno/console/printer.js";
import { createTable } from "ext:bueno/console/table.js";

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
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #infoPrinter = new Printer(LogLevel.info, defaultPrinterConfig);
  info(...args) {
    const printer = this.#infoPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #debugPrinter = new Printer(LogLevel.debug, defaultPrinterConfig);
  debug(...args) {
    const printer = this.#debugPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #warnPrinter = new Printer(LogLevel.warn, defaultPrinterConfig);
  warn(...args) {
    const printer = this.#warnPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #dirxmlPrinter = new Printer(LogLevel.dirxml, defaultPrinterConfig);
  dirxml(...args) {
    const printer = this.#dirxmlPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #dirPrinter = new Printer(LogLevel.dir, genericFormattingConfig);
  dir(arg, _options) {
    const printer = this.#dirPrinter;
    printer.print([arg], this.#groupStackSize);
  }

  #errorPrinter = new Printer(LogLevel.error, defaultPrinterConfig);
  error(...args) {
    const printer = this.#errorPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #tracePrinter = new Printer(LogLevel.trace, defaultPrinterConfig);
  trace(...args) {
    const printer = this.#tracePrinter;

    const error = {
      name: "Trace",
      message: printer
        .print(this.#formatter.format(args, printer), 0, false)
        .trim(),
    };
    Error.captureStackTrace(error, this.trace);

    printer.print(error.stack, this.#groupStackSize);
  }

  #assertPrinter = new Printer(LogLevel.assert, defaultPrinterConfig);
  assert(condition, ...args) {
    if (condition) return;
    const printer = this.#assertPrinter;
    const formatted = this.#formatter.format(args, printer);
    formatted.unshift("Assertion failed:");
    printer.print(formatted, this.#groupStackSize);
  }

  #tablePrinter = new Printer(LogLevel.table, genericFormattingConfig);
  table(data, columns) {
    const table = createTable(
      data,
      columns,
      this.#groupStackSize,
      defaultPrinterConfig,
    );
    this.#tablePrinter.print(table, 0);
  }

  clear() {
    core.print("\x1b[1;1H\x1b[0J", false);
  }
  //#endregion

  //#region Counting
  #countMap = {};

  #countPrinter = new Printer(LogLevel.count, genericFormattingConfig);
  count(label) {
    label = label ? String(label) : "default";

    this.#countMap[label] ??= 0;
    const value = ++this.#countMap[label];

    this.#countPrinter.print(`${label}: ${value}`);
  }

  #countResetPrinter = new Printer(
    LogLevel.countReset,
    genericFormattingConfig,
  );
  countReset(label) {
    label = label ? String(label) : "default";

    if (label in this.#countMap) {
      this.#countMap[label] &&= 0;
    } else {
      this.#countResetPrinter.print(`Count for '${label}' doesn't exist`);
    }
  }
  //#endregion

  //#region Timing
  #timerTable = {};

  #timePrinter = new Printer(LogLevel.time, genericFormattingConfig);
  time(label) {
    label = label ? String(label) : "default";

    if (label in this.#timerTable) {
      this.#timePrinter.print(
        `Timer '${label}' already exists`,
        this.#groupStackSize,
      );
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
      printer.print(args, this.#groupStackSize);
    } else {
      printer.print(`Timer '${label}' doesn't exist`, this.#groupStackSize);
    }
  }

  #timeEndPrinter = new Printer(LogLevel.timeEnd, genericFormattingConfig);
  timeEnd(label) {
    label = label ? String(label) : "default";

    const printer = this.#timeEndPrinter;

    if (label in this.#timerTable) {
      const duration = Date.now() - this.#timerTable[label];
      delete this.#timerTable[label];
      printer.print(`${label}: ${duration} ms`, this.#groupStackSize);
    } else {
      printer.print(`Timer '${label}' doesn't exist`, this.#groupStackSize);
    }
  }
  //#endregion

  //#region Grouping
  #groupStackSize = 0;
  #groupStack = [];

  #groupPrinter = new Printer(LogLevel.group, defaultPrinterConfig);
  group(...args) {
    if (args.length === 0) {
      args[0] = "\x1b[1mconsole.group\x1b[0m";
    }

    const printer = this.#groupPrinter;

    const groupName = printer
      .print(this.#formatter.format(args, printer), 0, false)
      .trim();

    this.#groupStack.unshift(groupName);
    this.#groupStackSize += 1;

    printer.print(`[ ${groupName} ]`, this.#groupStackSize);
  }

  groupCollapsed(...args) {
    this.group(...args);
  }

  groupEnd() {
    this.#groupStack.pop();
    this.#groupStackSize -= 1;
  }
  //#endregion
}

globalThis.console = new Console();
