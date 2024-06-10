import {
	op_encode,
	op_encoding_decode_single,
	op_encoding_decode_utf8,
	op_encoding_normalize_label,
} from "ext:core/ops";

/**
 * @typedef {Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array} TypedArray
 */

/**
 * @typedef {ArrayBuffer | TypedArray} BufferSource
 */

/**
 * @typedef {{ stream: boolean}} TextDecodeOptions
 */

/**
 * @typedef {{ fatal?: boolean, ignoreBOM?: boolean }} TextDecoderOptions
 */

export class TextDecoder {
	/** @type {string} */
	#encoding;
	/** @type {boolean} */
	#fatal;
	/** @type {boolean} */
	#ignoreBOM;
	/** @type {boolean} */
	#utf8SinglePass;

	/**
	 * @param {string} label
	 * @param {TextDecoderOptions} options
	 */
	constructor(label = "utf-8", options = {}) {
		const encoding = op_encoding_normalize_label(label);
		this.#encoding = encoding;
		this.#fatal = options.fatal;
		this.#ignoreBOM = options.ignoreBOM;
		this.#utf8SinglePass = encoding === "utf-8" && !options.fatal;
	}

	/** @returns {string} */
	get encoding() {
		return this.#encoding;
	}

	/** @returns {boolean} */
	get fatal() {
		return this.#fatal;
	}

	/** @returns {boolean} */
	get ignoreBOM() {
		return this.#ignoreBOM;
	}

	/**
	 * @param {BufferSource} [input]
	 * @param {TextDecodeOptions} options
	 */
	decode(input = new Uint8Array(), options = undefined) {
		let stream = false;
		if (options !== undefined) {
			stream = options.stream;
		}

		/** @type {ArrayBufferLike} */
		let buffer = input;
		if (ArrayBuffer.isView(buffer)) {
			buffer = buffer.buffer;
		}

		if (buffer instanceof SharedArrayBuffer) {
			// TODO(lino-levan): Implement SAB
			throw new Error("SharedArrayBuffer is not yet implemented");
		}

		if (!stream) {
			// Fast path for utf8 single pass encoding.
			if (this.#utf8SinglePass) {
				return op_encoding_decode_utf8(input, this.#ignoreBOM);
			}

			return op_encoding_decode_single(
				input,
				this.#encoding,
				this.#fatal,
				this.#ignoreBOM,
			);
		}

		// TODO(lino-levan): Implement stream decoding.
		throw new Error("Unimplemented");
	}
}

export class TextEncoder {
	/** @returns {string} */
	get encoding() {
		return "utf-8";
	}

	/**
	 * @param {string} input
	 * @returns {Uint8Array}
	 */
	encode(input = "") {
		return op_encode(input);
	}

	// TODO(lino-levan): Implement encodeInto
}
