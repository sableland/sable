export class Formatter {
	/**
	 * Return first spotted format specifier
	 * @see https://console.spec.whatwg.org/#formatting-specifiers
	 *
	 * @param {string} text
	 * @returns {string | undefined} format specifier, if not existent returns undefined
	 */
	#getFormatSpecifier(text) {
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
	 * Format given specifiers into a string
	 * @see https://console.spec.whatwg.org/#formatter
	 *
	 * @param {any[]} args
	 * @param {import('./printer').Printer} [printer=undefined]
	 * @returns array of formatted args
	 */
	format(args, printer = undefined) {
		if (args.length === 1) {
			return args;
		}

		const formatted = [];

		for (let i = 0; i < args.length; ++i) {
			let arg = args[i];
			let specifier = this.#getFormatSpecifier(arg);

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
							current instanceof Symbol ? "NaN" : parseInt(current),
						);
						break;
					case "%f":
						arg = arg.replace(
							specifier,
							current instanceof Symbol ? "NaN" : parseFloat(current),
						);
						break;
					case "%o":
						arg = arg.replace(
							specifier,
							printer ? printer.format(current) : JSON.stringify(current),
						);
						break;
					case "%O":
						arg = arg.replace(
							specifier,
							printer
								? printer.genericFormat(current)
								: JSON.stringify(current),
						);
						break;
					case "%c":
						// TODO(Im-Beast): CSS Styling
						arg = arg.replace("%c", "");
						break;
					default:
						--i;
						break;
				}

				specifier = this.#getFormatSpecifier(arg);
			}

			formatted.push(arg);
		}

		return formatted;
	}
}
