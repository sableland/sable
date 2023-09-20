import { Formatter } from "ext:bueno/console/formatter.js";
import { Printer } from "ext:bueno/console/printer.js";
import { createTable } from "ext:bueno/console/table.js";

// TODO(Im-Beast): Expose to the users ability to customize Printer config

const core = Bueno.core;

const optimallyUsefulFormattingConfig = {
  indent: 2,
  maxDepth: 4,
  maxLineWidth: 80,
  maxItemsPerLine: 5,
  usefulFormatting: true,
};

const genericFormattingConfig = {
  indent: 2,
  usefulFormatting: false,
};

/**
 * Class which creates a `console` namespace
 * @see https://console.spec.whatwg.org/#console-namespace
 */
export class Console {
  #formatter = new Formatter();

  // #region Logging
  #logPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
  log(...args) {
    const printer = this.#logPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #infoPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
  info(...args) {
    const printer = this.#infoPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #debugPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
  debug(...args) {
    const printer = this.#debugPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #warnPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
  warn(...args) {
    const printer = this.#warnPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #dirxmlPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
  dirxml(...args) {
    const printer = this.#dirxmlPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #dirPrinter = new Printer("stdout", genericFormattingConfig);
  dir(arg, _options) {
    const printer = this.#dirPrinter;
    printer.print([arg], this.#groupStackSize);
  }

  #errorPrinter = new Printer("stderr", optimallyUsefulFormattingConfig);
  error(...args) {
    const printer = this.#errorPrinter;
    printer.print(this.#formatter.format(args, printer), this.#groupStackSize);
  }

  #tracePrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
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

  #assertPrinter = new Printer("stderr", optimallyUsefulFormattingConfig);
  assert(condition, ...args) {
    if (condition) return;

    const printer = this.#assertPrinter;
    const formatted = this.#formatter.format(args, printer);
    formatted.unshift("Assertion failed:");
    printer.print(formatted, this.#groupStackSize);
  }

  #tablePrinter = new Printer("stdout", genericFormattingConfig);
  table(data, columns) {
    const table = createTable(
      data,
      columns,
      this.#tablePrinter,
      this.#groupStackSize,
    );
    this.#tablePrinter.print(table, 0);
  }

  clear() {
    core.print("\x1b[1;1H\x1b[0J", false);
  }
  // #endregion

  // #region Counting
  #countMap = {};

  #countPrinter = new Printer("stdout", genericFormattingConfig);
  count(label) {
    label = label ? String(label) : "default";

    this.#countMap[label] ??= 0;
    const value = ++this.#countMap[label];

    this.#countPrinter.print(`${label}: ${value}`);
  }

  #countResetPrinter = new Printer("stdout", genericFormattingConfig);
  countReset(label) {
    label = label ? String(label) : "default";

    if (label in this.#countMap) {
      this.#countMap[label] &&= 0;
    } else {
      this.#countResetPrinter.print(`Count for '${label}' doesn't exist`);
    }
  }
  // #endregion

  // #region Timing
  #timerTable = {};

  #timePrinter = new Printer("stdout", genericFormattingConfig);
  time(label) {
    label = label ? String(label) : "default";

    if (label in this.#timerTable) {
      this.#timePrinter.print(
        `Timer '${label}' already exists`,
        this.#groupStackSize,
        this.#groupStackSize,
      );
    } else {
      this.#timerTable[label] = performance.now();
    }
  }

  #timeLogPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
  timeLog(label, ...args) {
    label = label ? String(label) : "default";

    const printer = this.#timeLogPrinter;

    if (label in this.#timerTable) {
      const duration = performance.now() - this.#timerTable[label];
      args.unshift(`${label}: ${duration.toFixed(5)} ms`);
      printer.print(args, this.#groupStackSize);
    } else {
      printer.print(`Timer '${label}' doesn't exist`, this.#groupStackSize);
    }
  }

  #timeEndPrinter = new Printer("stdout", genericFormattingConfig);
  timeEnd(label) {
    label = label ? String(label) : "default";

    const printer = this.#timeEndPrinter;

    if (label in this.#timerTable) {
      const duration = performance.now() - this.#timerTable[label];
      delete this.#timerTable[label];
      printer.print(
        `${label}: ${duration.toFixed(5)} ms`,
        this.#groupStackSize,
      );
    } else {
      printer.print(`Timer '${label}' doesn't exist`, this.#groupStackSize);
    }
  }
  // #endregion

  // #region Grouping
  #groupStackSize = 0;
  #groupStack = [];

  #groupPrinter = new Printer("stdout", optimallyUsefulFormattingConfig);
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
  // #endregion
}

globalThis.console = new Console();
