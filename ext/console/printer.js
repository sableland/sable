const core = Bueno.core;

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

function styleFunction(fn) {
  return (
    colors.magenta + `[Function: ${fn.name || "( anonymous )"}]` + colors.reset
  );
}

function styleString(str) {
  return str;
}

function styleNumber(num) {
  return colors.lightBlue + num + colors.reset;
}

function styleObject(obj, indent = 0) {
  indent += 2;
  let str = "{";
  for (const key in obj) {
    const value = obj[key];

    str += `\n${" ".repeat(indent)}${key}: ${styleByType(value, indent)},`;
  }
  return str + "\n" + " ".repeat(indent - 2) + "}";
}

function styleByType(arg, indent) {
  switch (typeof arg) {
    case "string":
      return styleString(arg);
    case "number":
      return styleNumber(arg);
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

  core.print(string);
}
