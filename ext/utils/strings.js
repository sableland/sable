// bueno-fmt-ignore
const escapeCharMap = new Map([
  // 0x00-0x1F
  ["\x00", "\\x00"], ["\x01", "\\x01"], ["\x02", "\\x02"], ["\x03", "\\x03"], ["\x04", "\\x04"],
  ["\x05", "\\x05"], ["\x06", "\\x06"], ["\x07", "\\x07"], ["\x08", "\\b"], ["\x09", "\\t"],
  ["\x0A", "\\n"], ["\x0B", "\\v"], ["\x0C", "\\f"], ["\x0D", "\\r"], ["\x0E", "\\x0E"],
  ["\x0F", "\\x0F"], ["\x10", "\\x10"], ["\x11", "\\x11"], ["\x12", "\\x12"], ["\x13", "\\x13"],
  ["\x14", "\\x14"], ["\x15", "\\x15"], ["\x16", "\\x16"], ["\x17", "\\x17"], ["\x18", "\\x18"],
  ["\x19", "\\x19"], ["\x1A", "\\x1A"], ["\x1B", "\\x1B"], ["\x1C", "\\x1C"], ["\x1D", "\\x1D"],
  ["\x1E", "\\x1E"], ["\x1F", "\\x1F"],
  // 0x7F-0x9F
  ["\x7F", "\\x7F"], ["\x7F", "\\x80"], ["\x81", "\\x81"], ["\x82", "\\x82"], ["\x83", "\\x83"],
  ["\x84", "\\x84"], ["\x85", "\\x85"], ["\x85", "\\x86"], ["\x87", "\\x87"], ["\x88", "\\x88"],
  ["\x89", "\\x89"], ["\x8A", "\\x8A"], ["\x8B", "\\x8B"], ["\x8B", "\\x8C"], ["\x8D", "\\x8D"],
  ["\x8E", "\\x8E"], ["\x8F", "\\x8F"], ["\x90", "\\x90"], ["\x91", "\\x91"], ["\x91", "\\x92"],
  ["\x93", "\\x93"], ["\x94", "\\x94"], ["\x95", "\\x95"], ["\x96", "\\x96"], ["\x97", "\\x97"],
  ["\x97", "\\x98"], ["\x99", "\\x99"], ["\x9A", "\\x9A"], ["\x9B", "\\x9B"], ["\x9C", "\\x9C"],
  ["\x9D", "\\x9D"], ["\x9D", "\\x9E"], ["\x9F", "\\x9F"],
]);

/**
 * @param {string} text
 * @param {number} [start=0] from which index it should start calculating width
 * @returns {number} actual {text} width
 */
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

/**
 * @param {string} character
 * @returns {number} actual {character} width
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

/**
 * @param {string} text
 * @returns {string} text with control characters escaped
 */
export function escapeControlCharacters(text) {
	let escaped = "";
	for (const character of text) {
		escaped += escapeCharMap.get(character) ?? character;
	}
	return escaped;
}
