/**
 * This whole module is made to parse CSS and convert it to ANSI escape codes for %c support in Formatter.
 * @module
 */

/**
 * @typedef {string | number} CssArg
 * @typedef {[ number, number, number ]} CssColor [ red, green, blue ]
 * @typedef {{
 * 		"color"?: string,
 * 		"background-color"?: string,
 * 		"text-decoration-line"?: string[],
 * 		"text-decoration-style"?: string,
 * 		"text-decoration-color"?: string,
 * 		"font-weight"?: string,
 * 		"font-style"?: string,
 * }} CssStyle
 */

/** @link https://www.w3.org/TR/css-color-3/#svg-color */
const cssKeywords = new Map([
	["black", 0x000000],
	["silver", 0xC0C0C0],
	["gray", 0x808080],
	["white", 0xFFFFFF],
	["maroon", 0x800000],
	["red", 0xFF0000],
	["purple", 0x800080],
	["fuchsia", 0xFF00FF],
	["green", 0x008000],
	["lime", 0x00FF00],
	["olive", 0x808000],
	["yellow", 0xFFFF00],
	["navy", 0x000080],
	["blue", 0x0000FF],
	["teal", 0x008080],
	["aqua", 0x00FFFF],
	["aliceblue", 0xf0f8ff],
	["antiquewhite", 0xfaebd7],
	["aqua", 0x00ffff],
	["aquamarine", 0x7fffd4],
	["azure", 0xf0ffff],
	["beige", 0xf5f5dc],
	["bisque", 0xffe4c4],
	["black", 0x000000],
	["blanchedalmond", 0xffebcd],
	["blue", 0x0000ff],
	["blueviolet", 0x8a2be2],
	["brown", 0xa52a2a],
	["burlywood", 0xdeb887],
	["cadetblue", 0x5f9ea0],
	["chartreuse", 0x7fff00],
	["chocolate", 0xd2691e],
	["coral", 0xff7f50],
	["cornflowerblue", 0x6495ed],
	["cornsilk", 0xfff8dc],
	["crimson", 0xdc143c],
	["cyan", 0x00ffff],
	["darkblue", 0x00008b],
	["darkcyan", 0x008b8b],
	["darkgoldenrod", 0xb8860b],
	["darkgray", 0xa9a9a9],
	["darkgreen", 0x006400],
	["darkgrey", 0xa9a9a9],
	["darkkhaki", 0xbdb76b],
	["darkmagenta", 0x8b008b],
	["darkolivegreen", 0x556b2f],
	["darkorange", 0xff8c00],
	["darkorchid", 0x9932cc],
	["darkred", 0x8b0000],
	["darksalmon", 0xe9967a],
	["darkseagreen", 0x8fbc8f],
	["darkslateblue", 0x483d8b],
	["darkslategray", 0x2f4f4f],
	["darkslategrey", 0x2f4f4f],
	["darkturquoise", 0x00ced1],
	["darkviolet", 0x9400d3],
	["deeppink", 0xff1493],
	["deepskyblue", 0x00bfff],
	["dimgray", 0x696969],
	["dimgrey", 0x696969],
	["dodgerblue", 0x1e90ff],
	["firebrick", 0xb22222],
	["floralwhite", 0xfffaf0],
	["forestgreen", 0x228b22],
	["fuchsia", 0xff00ff],
	["gainsboro", 0xdcdcdc],
	["ghostwhite", 0xf8f8ff],
	["gold", 0xffd700],
	["goldenrod", 0xdaa520],
	["gray", 0x808080],
	["green", 0x008000],
	["greenyellow", 0xadff2f],
	["grey", 0x808080],
	["honeydew", 0xf0fff0],
	["hotpink", 0xff69b4],
	["indianred", 0xcd5c5c],
	["indigo", 0x4b0082],
	["ivory", 0xfffff0],
	["khaki", 0xf0e68c],
	["lavender", 0xe6e6fa],
	["lavenderblush", 0xfff0f5],
	["lawngreen", 0x7cfc00],
	["lemonchiffon", 0xfffacd],
	["lightblue", 0xadd8e6],
	["lightcoral", 0xf08080],
	["lightcyan", 0xe0ffff],
	["lightgoldenrodyellow", 0xfafad2],
	["lightgray", 0xd3d3d3],
	["lightgreen", 0x90ee90],
	["lightgrey", 0xd3d3d3],
	["lightpink", 0xffb6c1],
	["lightsalmon", 0xffa07a],
	["lightseagreen", 0x20b2aa],
	["lightskyblue", 0x87cefa],
	["lightslategray", 0x778899],
	["lightslategrey", 0x778899],
	["lightsteelblue", 0xb0c4de],
	["lightyellow", 0xffffe0],
	["lime", 0x00ff00],
	["limegreen", 0x32cd32],
	["linen", 0xfaf0e6],
	["magenta", 0xff00ff],
	["maroon", 0x800000],
	["mediumaquamarine", 0x66cdaa],
	["mediumblue", 0x0000cd],
	["mediumorchid", 0xba55d3],
	["mediumpurple", 0x9370db],
	["mediumseagreen", 0x3cb371],
	["mediumslateblue", 0x7b68ee],
	["mediumspringgreen", 0x00fa9a],
	["mediumturquoise", 0x48d1cc],
	["mediumvioletred", 0xc71585],
	["midnightblue", 0x191970],
	["mintcream", 0xf5fffa],
	["mistyrose", 0xffe4e1],
	["moccasin", 0xffe4b5],
	["navajowhite", 0xffdead],
	["navy", 0x000080],
	["oldlace", 0xfdf5e6],
	["olive", 0x808000],
	["olivedrab", 0x6b8e23],
	["orange", 0xffa500],
	["orangered", 0xff4500],
	["orchid", 0xda70d6],
	["palegoldenrod", 0xeee8aa],
	["palegreen", 0x98fb98],
	["paleturquoise", 0xafeeee],
	["palevioletred", 0xdb7093],
	["papayawhip", 0xffefd5],
	["peachpuff", 0xffdab9],
	["peru", 0xcd853f],
	["pink", 0xffc0cb],
	["plum", 0xdda0dd],
	["powderblue", 0xb0e0e6],
	["purple", 0x800080],
	["red", 0xff0000],
	["rosybrown", 0xbc8f8f],
	["royalblue", 0x4169e1],
	["saddlebrown", 0x8b4513],
	["salmon", 0xfa8072],
	["sandybrown", 0xf4a460],
	["seagreen", 0x2e8b57],
	["seashell", 0xfff5ee],
	["sienna", 0xa0522d],
	["silver", 0xc0c0c0],
	["skyblue", 0x87ceeb],
	["slateblue", 0x6a5acd],
	["slategray", 0x708090],
	["slategrey", 0x708090],
	["snow", 0xfffafa],
	["springgreen", 0x00ff7f],
	["steelblue", 0x4682b4],
	["tan", 0xd2b48c],
	["teal", 0x008080],
	["thistle", 0xd8bfd8],
	["tomato", 0xff6347],
	["turquoise", 0x40e0d0],
	["violet", 0xee82ee],
	["wheat", 0xf5deb3],
	["white", 0xffffff],
	["whitesmoke", 0xf5f5f5],
	["yellow", 0xffff00],
	["yellowgreen", 0x9acd32],
]);

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Part of HSL to RGB conversion algorithm
 * @param {number} hPrim hue prim
 * @param {number} c color
 * @param {number} x second biggest color component
 * @returns {[ number, number, number ]} rgb points
 */
function hslPoints(hPrim, c, x) {
	if (hPrim >= 0 && hPrim <= 1) {
		return [c, x, 0];
	} else if (hPrim <= 2) {
		return [x, c, 0];
	} else if (hPrim <= 3) {
		return [0, c, x];
	} else if (hPrim <= 4) {
		return [0, x, c];
	} else if (hPrim <= 5) {
		return [x, 0, c];
	} else if (hPrim <= 6) {
		return [c, 0, x];
	}
}

/**
 * @param {number} hex
 * @param {number} length
 * @returns {CssColor}
 */
function hexToRgb(hex, length = 6) {
	if (length === 3) {
		const r = (hex >> 8) & 0xf;
		const g = (hex >> 4) & 0xf;
		const b = hex & 0xf;
		return [r << 4 | r, g << 4 | g, b << 4 | b];
	}

	return [hex >> 16, (hex >> 8) & 0xff, hex & 0xff];
}

/**
 * @param {string} str
 * @returns {CssColor | undefined}
 */
function parseCssColor(str) {
	if (str.at(-1) === ")") {
		const [identifier, args] = parseCssFunction(str);

		// Alpha is completely ignored
		switch (identifier) {
			case "rgb":
			case "rgba": {
				const [red, green, blue] = args.map((number) => {
					if (typeof number === "string") {
						return parseInt(number);
					}
					return clamp(Math.round(number < 1 ? number * 255 : number), 0, 255);
				});
				return [red, green, blue];
			}
			/** @link https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB */
			case "hsl":
			case "hsla": {
				// H in degrees, S and L in percent
				const [hue, saturation, light] = args.map((number, i) => {
					if (typeof number === "string") {
						return parseInt(number);
					}
					const maxValue = i === 0 ? 360 : 100;
					const percentage = clamp(
						number < 1 ? number : number / maxValue,
						0,
						1,
					);

					return i === 0 ? Math.round(percentage * maxValue) : percentage;
				});

				const chroma = (1 - Math.abs(2 * light - 1)) * saturation;
				const huePrim = hue / 60;
				const x = chroma * (1 - Math.abs(huePrim % 2 - 1));

				const lightnessCorrection = light - chroma / 2;
				const [red, green, blue] = hslPoints(huePrim, chroma, x)
					.map((point) => Math.round((point + lightnessCorrection) * 255));

				return [red, green, blue];
			}
		}
	} else if (str[0] === "#") {
		return hexToRgb(parseInt(str.slice(1), 16));
	} else if (cssKeywords.has(str)) {
		return hexToRgb(cssKeywords.get(str.toLowerCase()));
	}
}

/**
 * @param {string} str
 * @returns {[ string, CssArg[] ] | undefined} [ identifier, args ]
 */
function parseCssFunction(str) {
	const parenIndex = str.indexOf("(");
	if (parenIndex === -1) return;
	const identifier = str.slice(0, parenIndex);
	if (!identifier) return;

	const args = str
		.slice(parenIndex + 1, -1)
		.split(",")
		.map(parseCssArg);

	return [identifier, args];
}

/**
 * @param {string} str
 * @returns {CssArg}
 */
function parseCssArg(str) {
	if (str.at(-1) === "%") {
		return parseFloat(str) / 100;
	} else if (str[0] === "'" || str[0] === '"') {
		return str.slice(1, -1);
	} else {
		return parseFloat(str);
	}
}

/**
 * @param {string} str
 * @returns {CssStyle}
 */
export function parseCss(str) {
	/** @type {CssStyle} */
	const style = {};

	let property = "";
	let intermediate = "";
	for (let i =0; i < str.length;++i) {
		const char = str[i];
		const lastLoop = i === str.length - 1;

		if (char === ":") {
			property = intermediate.trim();
			intermediate = "";
		} else if (char === ";" || lastLoop) {
			if (lastLoop && char !== ";")	intermediate += char;

			const value = intermediate.trim();
			intermediate = "";

			switch (property) {
				case "text-decoration":
					for (const item of value.split(/\s+/)) {
						switch (item) {
							case "underline":
							case "overline":
							case "line-through":
							case "blink":
								(style["text-decoration-line"] ??= []).push(item);
								break;
							default: {
								const color = parseCssColor(item);
								if (color) {
									style["text-decoration-color"] = item;
								}
								// text-decoration-style and text-decoration-thickness are not supported in any capacity
							}
						}
					}
					break;
				default:
					style[property] = value;
					break;
			}
		} else {
			intermediate += char;
		}
	}

	return style;
}

/**
 * @param {CssStyle} style
 * @returns {string}
 */
export function cssStyleToAnsi(style) {
	let ansi = "";

	if (style.color) {
		const color = parseCssColor(style.color);
		if (color) {
			ansi += `\x1b[38;2;${color[0]};${color[1]};${color[2]}m`;
		}
	}

	if (style["background-color"]) {
		const color = parseCssColor(style["background-color"]);
		if (color) {
			ansi += `\x1b[48;2;${color[0]};${color[1]};${color[2]}m`;
		}
	}

	if (style["text-decoration-line"]) {
		for (const decoration of style["text-decoration-line"]) {
			switch (decoration) {
				case "underline":
					ansi += "\x1b[4m";
					break;
				case "overline":
					ansi += "\x1b[53m";
					break;
				case "line-through":
					ansi += "\x1b[9m";
					break;
				case "blink":
					ansi += "\x1b[5m";
					break;
			}
		}
	}

	if (style["text-decoration-color"]) {
		const color = parseCssColor(style["text-decoration-color"]);
		// This only colors underline (and is non-standard).
		// there is no ANSI escape codes for coloring other decorations
		ansi += `\x1b[58;2;${color[0]};${color[1]};${color[2]}m`;
	}

	if (style["font-weight"]) {
		switch (style["font-weight"]) {
			case "bold":
				ansi += "\x1b[1m";
				break;
		}
	}

	if (style["font-style"]) {
		switch (style["font-style"]) {
			case "italic":
			case "oblique":
				ansi += "\x1b[3m";
				break;
		}
	}

	return ansi;
}