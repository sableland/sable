import { styles } from "ext:bueno/utils/ansi.js";
import { escapeControlCharacters, textWidth } from "ext:bueno/utils/strings.js";

// TODO(Im-Beast): Create a list of "standard" colors used for formatting so they actually mean something

const core = Bueno.core;

const TypedArray = Object.getPrototypeOf(Int8Array);

/** @see https://console.spec.whatwg.org/#printer */
export class Printer {
  #nextRefId;

  /**
   * @type {Printer}
   * @param {"stdout" | "stderr"} logLevel Output to use in `print()` method
   *
   * @param {object} [config] Printer configuration
   * @param {number} [config.indent=2] How many spaces to use as an indent
   * @param {number} [config.maxDepth=4] Maximum amount of nested objects to traverse in an object before evaluating it using `.toString()`
   * @param {number} [config.maxLineWidth=80] Maximum amount of text before breaking a line
   * @param {number} [config.maxIterableLengthPerLine=5] Maximum amount of items per line in an Iterable (e.g. Array, Set)
   * @param {boolean} [config.evaluateGetters=false] Whether to evaluate values of getters
   * @param {boolean} [config.usefulFormatting=true] Whether to use "optimally useful formatting" (pretty colors and stuff) {@link https://console.spec.whatwg.org/#optimally-useful-formatting}
   */
  constructor(logLevel, config) {
    this.logLevel = logLevel;

    this.indent = config?.indent ?? 2;
    this.maxDepth = config?.maxDepth ?? 4;
    this.maxLineWidth = config?.maxLineWidth ?? 80;
    this.evaluateGetters = config?.evaluateGetters ?? false;
    this.usefulFormatting = config?.usefulFormatting ?? true;
    this.maxItemsPerLine = config?.maxIterableLengthPerLine ?? 5;

    this.currentDepth = 0;
    this.refMap = new Map();
    this.spottedObjects = new Map();
    this.#nextRefId = 1;
  }

  /**
   * @param {string | any[]} stringOrArgs Item(s) that need to be formatted and printed
   * @param {number} groupStackSize `console.group` indentation level
   * @param {boolean} print Whether to print to the output or not
   * @returns {string} formatted output
   */
  print(stringOrArgs, groupStackSize, print = true) {
    let string = "";

    const groupIndent = " ".repeat(groupStackSize * this.indent);

    if (typeof stringOrArgs === "string") {
      string += groupIndent;
      string += this.format(stringOrArgs)
        .replaceAll("\n", "\n" + groupIndent);
    } else {
      const args = stringOrArgs;

      for (let i = 0; i < args.length; ++i) {
        const arg = args[i];

        if (i > 0) string += " ";

        string += groupIndent;
        string +=
          (this.usefulFormatting ? this.format(arg) : this.genericFormat(arg))
            .replaceAll("\n", "\n" + groupIndent);
      }
    }

    this.spottedObjects.clear();

    const output = string + "\n";

    if (print) {
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
    }

    return output;
  }

  /**
   * Format object using "optimally useful formatting"
   * @see https://console.spec.whatwg.org/#optimally-useful-formatting
   *
   * @param {any} arg Item to format
   * @param {number} depth Currently traversed depth
   * @returns {string} Formatted `arg`
   */
  format(arg, depth = 0) {
    switch (typeof arg) {
      // primitives
      case "string":
        // depth here is passed just to check whether it should style it
        return this.#formatString(arg, depth);
      case "number":
        return this.#formatNumber(arg);
      case "bigint":
        return this.#formatBigInt(arg);
      case "boolean":
        return this.#formatBoolean(arg);
      case "symbol":
        return this.#formatSymbol(arg);
      case "undefined":
        return this.#formatUndefined();

      // non-primitives
      case "function":
        return this.#formatFunction(arg);
      case "object":
        if (depth > this.maxDepth) {
          return arg.toString();
        } else if (this.spottedObjects.has(arg) && this.refMap.has(arg)) {
          return this.#formatCircular(arg);
        }

        return this.#formatObject(arg, depth);

      default:
        return arg?.toString() ?? arg;
    }
  }

  /**
   * Format object using "generic javascript object formatting"
   * @see https://console.spec.whatwg.org/#generic-javascript-object-formatting
   *
   * @param {any} arg Item to format
   * @param {number} depth Currently traversed depth
   * @returns {string} Formatted `arg`
   */
  genericFormat(arg) {
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
        const constructorName = stringTag ??
          (stringified.startsWith("class") ? "Class" : "Function");

        return `${constructorName} (${fn.name || "anonymous"})`;
      }
      case "object":
        return JSON.stringify(arg, null, " ");

      // anything that can just be `arg.toString()` and looks alright
      default:
        return arg?.toString() ?? arg;
    }
  }

  #formatObject(obj, depth = 0, circular = false) {
    if (obj === null) return this.#formatNull(depth);

    let formatted = "";
    let index = this.spottedObjects.get(obj);

    if (circular) {
      const refId = this.refMap.get(obj);

      formatted += `${styles.red}<ref *${
        refId ?? this.#nextRefId
      }>${styles.reset} `;

      if (!refId) {
        this.refMap.set(obj, this.#nextRefId++);
      }
    } else if (!index) {
      this.spottedObjects.set(obj, 1);
      index = 1;
    }

    const spottedAmount = index;

    if (Array.isArray(obj)) {
      formatted += this.#formatArray(obj, depth);
    } else if (obj instanceof Map) {
      formatted += this.#formatMap(obj, depth);
    } else if (obj instanceof Set) {
      formatted += this.#formatSet(obj, depth);
    } else if (obj instanceof WeakMap) {
      formatted += this.#formatWeakMap();
    } else if (obj instanceof Promise) {
      formatted += this.#formatPromise(obj, depth);
    } else if (Object.getPrototypeOf(obj.constructor) === TypedArray) {
      formatted += this.#formatTypedArray(obj, depth);
    } else {
      formatted += this.#formatRecord(obj, depth);
    }
    this.spottedObjects.set(obj, this.spottedObjects.get(obj) + 1);

    if (!circular && this.spottedObjects.get(obj) > spottedAmount + 1) {
      return this.#formatObject(obj, depth, true);
    }

    return formatted;
  }

  #formatCircular(obj) {
    return `${styles.bold}${styles.red}Circular<*${
      this.refMap.get(obj)
    }>${styles.reset}`;
  }

  #formatFunction(fn) {
    const stringified = fn.toString();

    const stringTag = fn[Symbol.toStringTag];
    const constructorName = stringTag ??
      (stringified.startsWith("class") ? "Class" : "Function");

    return `${styles.lightMagenta} [${constructorName}: ${
      fn.name || "( anonymous )"
    }]${styles.reset}`;
  }

  #formatString(str, depth, escape = false) {
    if (escape) {
      str = escapeControlCharacters(str);
    }

    return depth > 0 ? `${styles.yellow}"${str}"${styles.reset}` : str;
  }

  #formatBigInt(bigint) {
    return `${styles.lightBlue}${bigint}n${styles.reset}`;
  }

  #formatNumber(num) {
    return `${styles.lightBlue}${num}${styles.reset}`;
  }

  #formatBoolean(bool) {
    return `${styles.blue}${bool}${styles.reset}`;
  }

  #formatSymbol(sym) {
    return `${styles.lightYellow}${sym.toString()}${styles.reset}`;
  }

  #formatUndefined() {
    return `${styles.lightBlack}undefined${styles.reset}`;
  }

  #formatNull() {
    return `${styles.lightBlack}null${styles.reset}`;
  }

  #formatTypedArray(typedarr, depth) {
    return `${typedarr.constructor.name}(${typedarr.length}) [ ${
      this.#formatIterable(typedarr, depth)
    } ]`;
  }

  #formatArray(arr, depth) {
    return `Array(${arr.length}) [ ${this.#formatIterable(arr, depth)} ]`;
  }

  #formatSet(set, depth) {
    return `Set(${set.size}) [ ${this.#formatIterable(set, depth)} ]`;
  }

  #formatWeakMap() {
    return `WeakMap { ${styles.lightRed}items unknown${styles.reset} }`;
  }

  #formatIterable(iter, depth, short = true) {
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

      const styled = this.format(value, depth);
      if (short && styled.includes("\n")) {
        return this.#formatIterable(iter, depth - 1, false);
      }
      string += styled;

      ++amount;
    }

    if (wraps) {
      string += "\n" + " ".repeat(depth - 1);
    }

    return string;
  }

  #formatPromise(promise, depth) {
    let info = `${styles.yellow}unknown${styles.reset}`;

    try {
      const details = core.getPromiseDetails(promise);
      const state = details[0];
      const result = details[1];

      switch (state) {
        case 0:
          info = `${styles.lightCyan}pending${styles.reset}`;
          break;
        case 1:
          info = `${styles.lightGreen}fulfilled${styles.reset} => ${
            this.format(
              result,
              depth,
            )
          }`;
          break;
        case 2:
          info = `${styles.lightRed}rejected${styles.reset} => ${
            this.format(
              result,
              depth,
            )
          }`;
          break;
      }
    } catch {}

    return `Promise { ${info} }`;
  }

  #formatMap(map, depth, short = true) {
    depth += 1;
    const indent = depth * this.indent;
    let str = "";

    str += `Map(${map.size}) `;
    str += short ? "{ " : "{";

    let amount = 0;
    for (const [key, value] of map.entries()) {
      if (short) {
        if (amount > 0) str += ", ";
        str += `${key} => ${this.format(value, depth)}`;

        if (
          amount > this.maxItemsPerLine || textWidth(str) > this.maxLineWidth
        ) {
          return this.#formatMap(map, depth - 1, false);
        }
      } else {
        str += `\n${" ".repeat(indent)}${key} => ${this.format(value, depth)},`;
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

  #formatRecord(obj, depth, short = true) {
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
      const descriptor = Object.getOwnPropertyDescriptor(obj, key);

      let formattedKey = escapeControlCharacters(key);
      if (formattedKey !== key) {
        formattedKey = this.#formatString(formattedKey, depth, false);
      }

      const formattedValue = this.#formatPropertyDescriptor(descriptor, depth);

      if (short) {
        if (amount > 0) str += ", ";

        str += `${formattedKey}: ${formattedValue}`;

        if (
          amount > this.maxItemsPerLine ||
          textWidth(str) > this.maxLineWidth
        ) {
          return this.#formatRecord(obj, depth - 1, false);
        }
      } else {
        str += `\n${" ".repeat(indent)}${formattedKey}: ${formattedValue},`;
      }

      ++amount;
    }

    if (amount === 0) {
      return "{}";
    }

    if (!short) {
      str += "\n";
      str += " ".repeat(indent - this.indent) + "}";
    } else {
      str += " }";
    }

    return str;
  }

  #formatPropertyDescriptor(descriptor, depth) {
    const get = descriptor.get;
    const set = descriptor.set;

    if (descriptor.value !== undefined || !(get || set)) {
      return this.format(descriptor.value, depth);
    }

    const getterStyle = styles.cyan;

    let formattedGetterValue = "";
    if (get && this.evaluateGetters) {
      formattedGetterValue = ` { ${styles.reset}${
        this.format(get(), depth)
      }${getterStyle} }`;
    }

    if (get && set) {
      return `${getterStyle}<Getter${formattedGetterValue} & Setter>${styles.reset}`;
    } else if (get && !set) {
      return `${getterStyle}<Getter${formattedGetterValue}>${styles.reset}`;
    } else if (!get && set) {
      return `${getterStyle}<Setter>${styles.reset}`;
    }
  }
}
