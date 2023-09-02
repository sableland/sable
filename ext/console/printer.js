const core = Bueno.core;

// TODO: TypedArrays, Promises,
// TODO: Limit depth
// FIXME: Handle circular objects

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

function colorize(str, color) {
  return colors[color] + str + colors.reset;
}

function styleFunction(fn) {
  const stringified = fn.toString();

  const stringTag = fn[Symbol.toStringTag];
  const constructorName =
    stringTag ?? (stringified.startsWith("class") ? "Class" : "Function");

  return colorize(
    `[${constructorName}: ${fn.name || "( anonymous )"}]`,
    "magenta"
  );
}

function styleString(str, indent) {
  return indent !== undefined ? colorize(`"${str}"`, "yellow") : str;
}

function styleBigInt(bigint) {
  return colorize(bigint + "n", "lightBlue");
}

function styleNumber(num) {
  return colorize(num, "lightBlue");
}

function styleBoolean(bool) {
  return colorize(bool, "blue");
}

function styleSymbol(num) {
  return colorize(num.toString(), "lightYellow");
}

function styleArray(arr, indent) {
  return `Array(${arr.length}) [ ${styleIterable(arr, indent)}  ]`;
}

function styleSet(set, indent) {
  return `Set(${set.size}) [ ${styleIterable(set, indent)}  ]`;
}

function styleIterable(iter, indent, short = true) {
  indent += 2;

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

    const styled = styleByType(value, indent);
    if (short && styled.includes("\n")) {
      return styleIterable(iter, indent - 2, false);
    }
    string += styled;

    ++amount;
  }

  if (wraps) {
    string += "\n" + " ".repeat(indent - 2);
  }

  return string;
}

function styleWeakMap() {
  return `WeakMap { ${colorize("items unknown", "lightRed")} }`;
}

function styleMap(map, indent, short = true) {
  indent += 2;
  let str = "";

  str += `Map(${map.size})`;
  str += short ? "{ " : "{";

  let amount = 0;
  for (const [key, value] of map.entries()) {
    if (short) {
      if (amount > 0) str += ", ";
      str += `${key} => ${styleByType(value, indent)}`;

      if (amount > 5 || str.length > 120) {
        return styleMap(map, indent - 2, false);
      }
    } else {
      str += `\n${" ".repeat(indent)}${key} => ${styleByType(value, indent)},`;
    }

    ++amount;
  }

  if (!short) {
    str += "\n";
    str += " ".repeat(indent - 2) + "}";
  } else {
    str += " }";
  }

  return str;
}

function styleRecord(obj, indent, short = true) {
  indent += 2;
  let str = "";

  if (obj.constructor !== Object) {
    // Object is a class
    str += colorize(obj.constructor.name, "lightMagenta") + " ";
  }

  str += short ? "{ " : "{";

  let amount = 0;
  for (const key in obj) {
    const value = obj[key];

    if (short) {
      if (amount > 0) str += ", ";
      str += `${key}: ${styleByType(value, indent)}`;

      if (amount > 5 || str.length > 120) {
        return styleRecord(obj, indent - 2, false);
      }
    } else {
      str += `\n${" ".repeat(indent)}${key}: ${styleByType(value, indent)},`;
    }

    ++amount;
  }

  if (amount === 0) return "{}";

  if (!short) {
    str += "\n";
    str += " ".repeat(indent - 2) + "}";
  } else {
    str += " }";
  }

  return str;
}

function styleObject(obj, indent = 0) {
  if (Array.isArray(obj)) {
    return styleArray(obj, indent);
  } else if (obj instanceof Map) {
    return styleMap(obj, indent);
  } else if (obj instanceof Set) {
    return styleSet(obj, indent);
  } else if (obj instanceof WeakMap) {
    return styleWeakMap();
  } else {
    return styleRecord(obj, indent);
  }
}

function styleByType(arg, indent) {
  switch (typeof arg) {
    // primitives
    case "string":
      return styleString(arg, indent);
    case "number":
      return styleNumber(arg);
    case "bigint":
      return styleBigInt(arg);
    case "boolean":
      return styleBoolean(arg);
    case "symbol":
      return styleSymbol(arg);

    // non-primitives
    case "function":
      return styleFunction(arg);
    case "object":
      return styleObject(arg, indent);
    default:
      return arg;
  }
}

export function print(args) {
  let string = "";

  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (i > 0) string += " ";
    string += styleByType(arg);
  }

  string += "\n";
  return string;
}
