/**
 * @param {string} text
 * @returns {string | undefined} format specifier, if not existent returns undefined
 */
function getFormatSpecifier(text) {
  if (typeof text !== "string") return undefined;

  const index = text.indexOf("%");
  if (index === -1) return undefined;

  const specifier = text[index + 1];
  switch (specifier) {
    case "s":
    case "d":
    case "i":
    case "f":
    case "o":
    case "O":
    case "c":
      return `%${specifier}`;
    default:
      return undefined;
  }
}

/**
 * https://console.spec.whatwg.org/#formatter
 * Format specifiers
 * @param {any[]} args
 * @returns array of formatted args
 */
export function format(args) {
  if (args.length === 1) {
    return args;
  }

  const formatted = [];

  for (let i = 0; i < args.length; ++i) {
    let arg = args[i];
    let specifier = getFormatSpecifier(arg);

    while (specifier) {
      const current = args[++i];

      switch (specifier) {
        case "%s":
          arg = arg.replace("%s", current);
          break;
        case "%d":
        case "%i":
          arg = arg.replace(
            specifier,
            current instanceof Symbol ? "NaN" : parseInt(current)
          );
          break;
        case "%f":
          arg = arg.replace(
            specifier,
            current instanceof Symbol ? "NaN" : parseFloat(current)
          );
          break;
        case "%o":
        case "%O":
          // TODO: use better object formatting
          arg = arg.replace(specifier, JSON.stringify(current));
          break;
        case "%c":
          // TODO: styling
          arg = arg.replace("%c", "");
          break;
        default:
          --i;
          break;
      }

      specifier = getFormatSpecifier(arg);
    }

    formatted.push(arg);
  }

  return formatted;
}
