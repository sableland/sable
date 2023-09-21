const core = Bueno.core;

/**
 * Reads a file asynchronously
 * @param {string} path
 * @returns {Promise<Uint8Array>}
 */
function readFile(path) {
	return core.ops.op_read_file(path);
}

/**
 * Reads a text file synchronously
 * @param {string} path
 * @returns {Promise<string>}
 */
function readTextFile(path) {
	return core.ops.op_read_text_file(path);
}

/**
 * Writes a file asynchronously
 * @param {string} path
 * @param {Uint8Array} contents
 * @returns {Promise<void>}
 */
function writeFile(path, contents) {
	core.ops.op_write_file(path, contents);
}

/**
 * Writes a text file asynchronously
 * @param {string} path
 * @param {string} contents
 * @returns {Promise<void>}
 */
function writeTextFile(path, contents) {
	core.ops.op_write_text_file(path, contents);
}

/**
 * Deletes file asynchronously
 * @param {string} path
 * @returns {Promise<void>}
 */
function removeFile(path) {
	core.ops.op_remove_file(path);
}

/**
 * Deletes directory asynchronously
 * @param {string} path
 * @param {boolean} recursive
 * @returns {Promise<void>}
 */
function removeDirectory(path, recursive) {
	core.ops.op_remove_dir(path, recursive);
}

Bueno.fs = {
	readFile,
	readTextFile,
	writeFile,
	writeTextFile,
	removeFile,
	removeDirectory,
};
