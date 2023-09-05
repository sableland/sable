const core = Bueno.core;

const ansiStyles = {
  // colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  lightBlack: "\x1b[90m",
  lightRed: "\x1b[91m",
  lightGreen: "\x1b[92m",
  lightYellow: "\x1b[93m",
  lightBlue: "\x1b[94m",
  lightMagenta: "\x1b[95m",
  lightCyan: "\x1b[96m",
  lightWhite: "\x1b[97m",

  // styles
  bold: "\x1b[1m",
  itallic: "\x1b[3m",

  // reset
  reset: "\x1b[0m",
};

const TypedArray = Object.getPrototypeOf(Int8Array);
function isTypedArray(obj) {
  return Object.getPrototypeOf(obj.constructor) === TypedArray;
}

function stylizeText(str, style) {
  return ansiStyles[style] + str + ansiStyles.reset;
}

export const LogLevel = {
  log: "stdout",
  info: "stdout",
  debug: "stdout",
  warn: "stdout",
  dir: "stdout",
  dirxml: "stdout",
  trace: "stdout",
  count: "stdout",
  countReset: "stdout",
  time: "stdout",
  timeLog: "stdout",
  timeEnd: "stdout",
  group: "stdout",
  table: "stdout",

  error: "stderr",
  assert: "stderr",
};

export class Printer {
  constructor(logLevel, config) {
    this.logLevel = logLevel;

    this.usefulFormatting = config?.usefulFormatting ?? true;

    this.indent = config?.indent ?? 2;
    this.maxDepth = config?.maxDepth ?? 4;
    this.maxLineWidth = config?.maxLineWidth ?? 80;
    this.maxItemsPerLine = config?.maxIterableLengthPerLine ?? 5;

    this.currentDepth = 0;
    this.objectId = 1;
    this.spottedObjects = new Set();
  }

  print(stringOrArgs, groupStackSize, print = true) {
    let string = "";

    if (typeof stringOrArgs === "string") {
      string += " ".repeat(groupStackSize * this.indent);
      string += this.style(stringOrArgs);
    } else {
      const args = stringOrArgs;

      for (let i = 0; i < args.length; ++i) {
        const arg = args[i];
        if (i > 0) string += " ";

        string += " ".repeat(groupStackSize * this.indent);
        string += this.usefulFormatting
          ? this.style(arg)
          : this.genericStyle(arg);

        this.spottedObjects.clear();
      }
    }

    const output = string + "\n";

    if (print)
      switch (this.logLevel) {
        case "stdout":
          core.print(output, false);
          break;
        case "stderr":
          core.print(output, true);
          break;
        default:
          throw new Error("Unknown Printer LogLevel:" + this.logLevel);
      }

    return output;
  }

  style(arg, depth) {
    switch (typeof arg) {
      // primitives
      case "string":
        // depth here is passed just to check whether it should style it
        return this.#styleString(arg, depth);
      case "number":
        return this.#styleNumber(arg);
      case "bigint":
        return this.#styleBigInt(arg);
      case "boolean":
        return this.#styleBoolean(arg);
      case "symbol":
        return this.#styleSymbol(arg);

      // non-primitives
      case "function":
        return this.#styleFunction(arg);
      case "object":
        if (depth > this.maxDepth) return arg.toString();
        return this.#styleObject(arg, depth);

      case "undefined":
        return this.#styleUndefined();

      default:
        return arg?.toString() ?? arg;
    }
  }

  genericStyle(arg) {
    switch (typeof arg) {
      // primitives
      case "string":
        return arg;
      case "bigint":
        return arg.toString() + "n";

      // non-primitives
      case "function": {
        const stringified = fn.toString();

        const stringTag = fn[Symbol.toStringTag];
        const constructorName =
          stringTag ?? (stringified.startsWith("class") ? "Class" : "Function");

        return `${constructorName} (${fn.name || "anonymous"})`;
      }
      case "object":
        return JSON.stringify(arg, null, " ");

      // anything that can just be .toString() and looks alright
      default:
        return arg?.toString() ?? arg;
    }
  }

  #styleObject(obj, depth = 0) {
    if (obj === null) return this.#styleNull(depth);

    if (this.spottedObjects.has(obj)) {
      // TODO(Im-Beast): add support for pointing object reference of the Circular
      return stylizeText(stylizeText("Circular", "red"), "bold");
    } else {
      this.spottedObjects.add(obj);
    }

    if (Array.isArray(obj)) {
      return this.#styleArray(obj, depth);
    } else if (obj instanceof Map) {
      return this.#styleMap(obj, depth);
    } else if (obj instanceof Set) {
      return this.#styleSet(obj, depth);
    } else if (obj instanceof WeakMap) {
      return this.#styleWeakMap();
    } else if (obj instanceof Promise) {
      return this.#stylePromise(obj, depth);
    } else if (isTypedArray(obj)) {
      return this.#styleTypedArray(obj, depth);
    } else {
      return this.#styleRecord(obj, depth);
    }
  }

  #styleFunction(fn) {
    const stringified = fn.toString();

    const stringTag = fn[Symbol.toStringTag];
    const constructorName =
      stringTag ?? (stringified.startsWith("class") ? "Class" : "Function");

    return stylizeText(
      `[${constructorName}: ${fn.name || "( anonymous )"}]`,
      "lightMagenta"
    );
  }

  // TODO(Im-Beast): Add support for unescaping ANSI sequences
  #styleString(str, depth) {
    return depth > 0 ? stylizeText(`"${str}"`, "yellow") : str;
  }

  #styleBigInt(bigint) {
    return stylizeText(bigint + "n", "lightBlue");
  }

  #styleNumber(num) {
    return stylizeText(num, "lightBlue");
  }

  #styleBoolean(bool) {
    return stylizeText(bool, "blue");
  }

  #styleSymbol(sym) {
    return stylizeText(sym.toString(), "lightYellow");
  }

  #styleUndefined() {
    return stylizeText("undefined", "lightBlack");
  }

  #styleNull() {
    return stylizeText("null", "lightBlack");
  }

  #styleTypedArray(typedarr, depth) {
    return `${typedarr.constructor.name}(${
      typedarr.length
    }) [ ${this.#styleIterable(typedarr, depth)} ]`;
  }

  #styleArray(arr, depth) {
    return `Array(${arr.length}) [ ${this.#styleIterable(arr, depth)} ]`;
  }

  #styleSet(set, depth) {
    return `Set(${set.size}) [ ${this.#styleIterable(set, depth)} ]`;
  }

  #styleWeakMap() {
    return `WeakMap { ${stylizeText("items unknown", "lightRed")} }`;
  }

  #styleIterable(iter, depth, short = true) {
    depth += 1;
    const indent = depth * this.indent;

    const wraps = (iter?.length ?? iter?.size) > this.maxItemsPerLine;
    let string = wraps ? "\n" : "";

    if (short && wraps) {
      string += " ".repeat(indent);
    }

    let amount = 0;
    for (const value of iter) {
      if (amount !== 0 && amount % this.maxItemsPerLine === 0) {
        string += "\n";
        if (short) {
          string += " ".repeat(indent);
        }
      } else if (amount > 0) {
        string += !short ? ",\n" : ", ";
      }

      if (!short) {
        string += " ".repeat(indent);
      }

      const styled = this.style(value, depth);
      if (short && styled.includes("\n")) {
        return this.#styleIterable(iter, depth - 1, false);
      }
      string += styled;

      ++amount;
    }

    if (wraps) {
      string += "\n" + " ".repeat(depth - 1);
    }

    return string;
  }

  #stylePromise(promise, depth) {
    let info = stylizeText("unknown", "yellow");

    try {
      const details = core.getPromiseDetails(promise);
      const state = details[0];
      const result = details[1];

      switch (state) {
        case 0:
          info = stylizeText("pending", "lightCyan");
          break;
        case 1:
          info = `${stylizeText("fulfilled", "lightGreen")} => ${this.style(
            result,
            depth
          )}`;
          break;
        case 2:
          info = `${stylizeText("rejected", "lightRed")} => ${this.style(
            result,
            depth
          )}`;
          break;
      }
    } catch {}

    return `Promise { ${info} }`;
  }

  #styleMap(map, depth, short = true) {
    depth += 1;
    const indent = depth * this.indent;
    let str = "";

    str += `Map(${map.size}) `;
    str += short ? "{ " : "{";

    let amount = 0;
    for (const [key, value] of map.entries()) {
      if (short) {
        if (amount > 0) str += ", ";
        str += `${key} => ${this.style(value, depth)}`;

        // FIXME(Im-Beast): str.length can actually include styles, so it invalidly checks maxLineWidth
        if (amount > this.maxItemsPerLine || str.length > this.maxLineWidth) {
          return this.#styleMap(map, depth - 1, false);
        }
      } else {
        str += `\n${" ".repeat(indent)}${key} => ${this.style(value, depth)},`;
      }

      ++amount;
    }

    if (!short) {
      str += "\n";
      str += " ".repeat(indent - this.indent) + "}";
    } else {
      str += " }";
    }

    return str;
  }

  #styleRecord(obj, depth, short = true) {
    depth += 1;
    const indent = depth * this.indent;
    let str = "";

    if (obj.constructor !== Object) {
      // Object is a class
      str += obj.constructor.name + " ";
    }

    str += short ? "{ " : "{";

    let amount = 0;
    for (const key in obj) {
      const value = obj[key];

      if (short) {
        if (amount > 0) str += ", ";
        str += `${key}: ${this.style(value, depth)}`;

        // FIXME(Im-Beast): str.length can actually include styles, so it invalidately checks maxLineWidth
        if (amount > this.maxItemsPerLine || str.length > this.maxLineWidth) {
          return this.#styleRecord(obj, depth - 1, false);
        }
      } else {
        str += `\n${" ".repeat(indent)}${key}: ${this.style(value, depth)},`;
      }

      ++amount;
    }

    if (amount === 0) return "{}";

    if (!short) {
      str += "\n";
      str += " ".repeat(indent - this.indent) + "}";
    } else {
      str += " }";
    }

    return str;
  }
}
