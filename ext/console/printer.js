const core = Bueno.core;

// TODO(Im-Beast): Limit depth
// FIXME(Im-Beast): Handle circular objects

const colors = {
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
  reset: "\x1b[0m",
};

const TypedArray = Object.getPrototypeOf(Int8Array);
function isTypedArray(obj) {
  return Object.getPrototypeOf(obj.constructor) === TypedArray;
}

function colorize(str, color) {
  return colors[color] + str + colors.reset;
}

export const LogLevel = {
  log: "stdout",
  info: "stdout",
  debug: "stdout",
  warn: "stdout",
  dir: "stdout",
  dirxml: "stdout",
  trace: "stdout",

  error: "stderr",
  assert: "stderr",
};

export class Printer {
  constructor(logLevel, config) {
    this.logLevel = logLevel;
    this.indent = config?.indent ?? 2;
    this.maxDepth = config?.maxDepth ?? 2;
    this.spottedObjects = new Set();
  }

  print(args) {
    let string = "";

    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if (i > 0) string += " ";
      string += this.style(arg);
    }

    string += "\n";
    return string;
  }

  style(arg, indent) {
    switch (typeof arg) {
      // primitives
      case "string":
        return this.#styleString(arg, indent);
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
        return this.#styleObject(arg, indent);
      default:
        return arg;
    }
  }

  #styleObject(obj, indent = 0) {
    if (Array.isArray(obj)) {
      return this.#styleArray(obj, indent);
    } else if (obj instanceof Map) {
      return this.#styleMap(obj, indent);
    } else if (obj instanceof Set) {
      return this.#styleSet(obj, indent);
    } else if (obj instanceof WeakMap) {
      return this.#styleWeakMap();
    } else if (obj instanceof Promise) {
      return this.#stylePromise(obj, indent);
    } else if (isTypedArray(obj)) {
      return this.#styleTypedArray(obj, indent);
    } else {
      return this.#styleRecord(obj, indent);
    }
  }

  #styleFunction(fn) {
    const stringified = fn.toString();

    const stringTag = fn[Symbol.toStringTag];
    const constructorName =
      stringTag ?? (stringified.startsWith("class") ? "Class" : "Function");

    return colorize(
      `[${constructorName}: ${fn.name || "( anonymous )"}]`,
      "magenta"
    );
  }

  #styleString(str, indent) {
    return indent !== undefined ? colorize(`"${str}"`, "yellow") : str;
  }

  #styleBigInt(bigint) {
    return colorize(bigint + "n", "lightBlue");
  }

  #styleNumber(num) {
    return colorize(num, "lightBlue");
  }

  #styleBoolean(bool) {
    return colorize(bool, "blue");
  }

  #styleSymbol(num) {
    return colorize(num.toString(), "lightYellow");
  }

  #styleTypedArray(typedarr, indent) {
    return `${typedarr.constructor.name}(${
      typedarr.length
    }) [ ${this.#styleIterable(typedarr, indent)}  ]`;
  }

  #styleArray(arr, indent) {
    return `Array(${arr.length}) [ ${this.#styleIterable(arr, indent)}  ]`;
  }

  #styleSet(set, indent) {
    return `Set(${set.size}) [ ${this.#styleIterable(set, indent)}  ]`;
  }

  #styleIterable(iter, indent, short = true) {
    indent += this.indent;

    const wraps = (iter?.length ?? iter?.size) > 5;
    let string = wraps ? "\n" : " ";

    if (short && wraps) {
      string += " ".repeat(indent);
    }

    let amount = 0;
    for (const value of iter) {
      if (amount !== 0 && amount % 5 === 0) {
        // ellipsis
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

      const styled = this.style(value, indent);
      if (short && styled.includes("\n")) {
        return this.#styleIterable(iter, indent - this.indent, false);
      }
      string += styled;

      ++amount;
    }

    if (wraps) {
      string += "\n" + " ".repeat(indent - this.indent);
    }

    return string;
  }

  #stylePromise(promise, indent) {
    let info = colorize("unknown", "yellow");

    try {
      const details = core.getPromiseDetails(promise);
      const state = details[0];
      const result = details[1];

      switch (state) {
        case 0:
          info = colorize("pending", "lightCyan");
          break;
        case 1:
          info = `${colorize("fulfilled", "lightGreen")} => ${this.style(
            result,
            indent
          )}`;
          break;
        case 2:
          info = `${colorize("rejected", "lightRed")} => ${this.style(
            result,
            indent
          )}`;
          break;
      }
    } catch {}

    return `Promise { ${info} }`;
  }

  #styleWeakMap() {
    return `WeakMap { ${colorize("items unknown", "lightRed")} }`;
  }

  #styleMap(map, indent, short = true) {
    indent += this.indent;
    let str = "";

    str += `Map(${map.size})`;
    str += short ? "{ " : "{";

    let amount = 0;
    for (const [key, value] of map.entries()) {
      if (short) {
        if (amount > 0) str += ", ";
        str += `${key} => ${this.style(value, indent)}`;

        if (amount > 5 || str.length > 120) {
          return this.#styleMap(map, indent - this.indent, false);
        }
      } else {
        str += `\n${" ".repeat(indent)}${key} => ${this.style(value, indent)},`;
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

  #styleRecord(obj, indent, short = true, depth) {
    indent += this.indent;
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
        str += `${key}: ${this.style(value, indent)}`;

        if (amount > 5 || str.length > 120) {
          return this.#styleRecord(obj, indent - this.indent, false);
        }
      } else {
        str += `\n${" ".repeat(indent)}${key}: ${this.style(value, indent)},`;
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
