import { loopAnsi } from "ext:sable/utils/loop_ansi.js";
import { charWidth } from "ext:sable/utils/char_width.js";

/**
 * Calculate width of given {input}.\
 * It counts the width of characters and ignores ANSI escape codes.\
 * It uses the same definition for character width as `charWidth`.
 *
 * @see {@link charWidth} - function used for character width calculation.
 *
 * @example
 * ```ts
 * console.log(textWidth("Hello world")); // 11
 * console.log(textWidth("\x1b[32mHello world\x1b[0m")); // 11
 * ```
 */
export function textWidth(text) {
  let width = 0;
  loopAnsi(text, (char, style) => {
    if (style) return;
    width += charWidth(char);
  });
  return width;
}
