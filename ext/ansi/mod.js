export const ansiStyles = {
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

/**
 * Return width of given character
 *
 * Originally created by sindresorhus: https://github.com/sindresorhus/is-fullwidth-code-point/blob/main/index.js
 */
export function characterWidth(character) {
  const codePoint = character.charCodeAt(0);

  if (codePoint === 0xD83E || codePoint === 0x200B) {
    return 0;
  }

  if (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (0x2e80 <= codePoint && codePoint <= 0x3247 && codePoint !== 0x303f) ||
      (0x3250 <= codePoint && codePoint <= 0x4dbf) ||
      (0x4e00 <= codePoint && codePoint <= 0xa4c6) ||
      (0xa960 <= codePoint && codePoint <= 0xa97c) ||
      (0xac00 <= codePoint && codePoint <= 0xd7a3) ||
      (0xf900 <= codePoint && codePoint <= 0xfaff) ||
      (0xfe10 <= codePoint && codePoint <= 0xfe19) ||
      (0xfe30 <= codePoint && codePoint <= 0xfe6b) ||
      (0xff01 <= codePoint && codePoint <= 0xff60) ||
      (0xffe0 <= codePoint && codePoint <= 0xffe6) ||
      (0x1b000 <= codePoint && codePoint <= 0x1b001) ||
      (0x1f200 <= codePoint && codePoint <= 0x1f251) ||
      (0x20000 <= codePoint && codePoint <= 0x3fffd))
  ) {
    return 2;
  }

  return 1;
}

export function textWidth(text, start = 0) {
  if (!text) return 0;

  let width = 0;
  let ansi = false;
  const len = text.length;
  for (let i = start; i < len; ++i) {
    const char = text[i];
    if (char === "\x1b") {
      ansi = true;
      i += 2; // [ "\x1b" "[" "X" "m" ] <-- shortest ansi sequence
    } else if (char === "m" && ansi) {
      ansi = false;
    } else if (!ansi) {
      width += characterWidth(char);
    }
  }

  return width;
}

export const ansi = {
  style(string, style) {
    return ansiStyles[style] + string + ansiStyles.reset;
  },
};
