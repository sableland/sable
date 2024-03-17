import { op_read, op_write, op_close } from "ext:core/ops";
import { Stderr, Stdin, Stdout } from "ext:sable/io/stdio.js";

/**
 * Read resource id asynchronously
 * @param {number} rid resource id
 * @param {Uint8Array} buffer buffer to read to
 * @returns number of bytes that has been read or `null` (EOF)
 */
async function read(rid, buffer) {
	// Can't read into nothing
	if (buffer.length === 0) return 0;
	return (await op_read(rid)) || null;
}

/**
 * Write data to resource id asynchronously
 * @param {number} rid resource id
 * @param {Uint8Array} data buffer to write
 * @returns number of bytes that has been written
 */
function write(rid, data) {
	return op_write(rid, data);
}

/**
 * Closes resource id
 * @param {number} rid resource id
 */
function close(rid) {
	op_close(rid);
}

Sable.io = {
	read,
	write,
	close,

	stdin: new Stdin(),
	stdout: new Stdout(),
	stderr: new Stderr(),
};
