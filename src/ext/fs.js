const core = Bueno.core;

/**
 * Reads a file asyncronously
 * @param {string} path
 * @returns {Promise<Uint8Array>}
 */
function readFile(path) {
  return core.ops.op_read_file(path);
}

/**
 * Reads a file syncronously
 * @param {string} path
 * @returns {Uint8Array}
 */
function readFileSync(path) {
  return core.ops.op_read_file_sync(path);
}

/**
 * Reads a text file asyncronously
 * @param {string} path
 * @returns {Promise<string>}
 */
function readTextFile(path) {
  return core.ops.op_read_text_file(path);
}

/**
 * Reads a text file syncronously
 * @param {string} path
 * @returns {string}
 */
function readTextFileSync(path) {
  return core.ops.op_read_text_file_sync(path);
}

/**
 * Writes a file asyncronously
 * @param {string} path
 * @param {Uint8Array} contents
 * @returns {Promise<void>}
 */
function writeFile(path, contents) {
  core.ops.op_write_file(path, contents);
}

/**
 * Writes a file syncronously
 * @param {string} path
 * @param {Uint8Array} contents
 * @returns {void}
 */
function writeFileSync(path, contents) {
  core.ops.op_write_file_sync(path, contents);
}

/**
 * Writes a text file asyncronously
 * @param {string} path
 * @param {string} contents
 * @returns {Promise<void>}
 */
function writeTextFile(path, contents) {
  core.ops.op_write_text_file(path, contents);
}

/**
 * Writes a text file syncronously
 * @param {string} path
 * @param {string} contents
 * @returns {void}
 */
function writeTextFileSync(path, contents) {
  core.ops.op_write_text_file_sync(path, contents);
}

/**
 * Deletes file asyncronously
 * @param {string} path
 * @returns {Promise<void>}
 */
function remove(path) {
  core.ops.op_remove_file(path);
}

/**
 * Deletes file syncronously
 * @param {string} path
 * @returns {void}
 */
function removeSync(path) {
  core.ops.op_remove_file_sync(path);
}

Bueno.fs = {
  readFile,
  readFileSync,
  readTextFile,
  readTextFileSync,
  writeFile,
  writeFileSync,
  writeTextFile,
  writeTextFileSync,
  remove,
  removeSync,
};
