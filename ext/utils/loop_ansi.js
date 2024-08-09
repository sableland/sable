/**
 * Loop over {input}.\
 * For every character, that's not an ansi sequence call {callback}.\
 * If between last and current call there was an ansi style,
 * the second argument of that callback will be equal to that style.\
 * Returning `true` from {callback} will break the loop.
 *
 * @example
 * ```ts
 * let text = "";
 * let styles = "";
 * loopAnsi("\x1b[32mHello world\x1b[0m", (char, style) => {
 *    if (style) {
 *      styles += style;
 *    } else {
 *      text += char
 *    };
 * });
 *
 * console.log(text); // "Hello world"
 * console.log(styles); "\x1b[32m\x1b[0m"
 * ```
 *
 * @example
 * ```ts
 * let text = "";
 * loopAnsi("Hello world", (char) => {
 *    text += char;
 *    if (char === "o") {
 *      return true;
 *    }
 * });
 *
 * console.log(text); // "Hello"
 * ```
 *
 * @param {string} input
 * @param {(char: string, lastStyle?: string) => void | boolean} callback
 * @returns {void}
 */
export function loopAnsi(input, callback) {
	let ansi = 0;
	let style = "";

	for (const char of input) {
		if (char === "\x1b") {
			ansi = 1;
			style += char;
		} else if (ansi >= 3 && isFinalAnsiByte(char)) {
			if (callback(char, style + char)) break;
			style = "";
			ansi = 0;
		} else if (ansi > 0) {
			ansi += 1;
			style += char;
		} else {
			if (callback(char)) break;
		}
	}
}

/**
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code}
 * @param {string} character
 * @returns {boolean} true if {character} is final byte of ansi sequence
 */
export function isFinalAnsiByte(character) {
	const charCode = character.charCodeAt(0);
	// final byte is one in range 0x40-0x7E
	// We don't include 0x70-0x7E range because its considered "private"
	return charCode >= 0x40 && charCode < 0x70;
}
