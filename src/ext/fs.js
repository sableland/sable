const core = Bueno.core;

/**
 * Reads a text file asyncronously
 * @param {string} path
 * @returns {Promise<string>}
 */
function readTextFile(path) {
  return core.ops.op_read_file(path);
}

/**
 * Writes a text file asyncronously
 * @param {string} path
 * @param {string} contents
 * @returns {Promise<void>}
 */
function writeTextFile(path, contents) {
  core.ops.op_write_file(path, contents);
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
 * Reads a text file syncronously
 * @param {string} path
 * @returns {string}
 */
function readTextFileSync(path) {
  return core.ops.op_read_file_sync(path);
}

/**
 * Writes a text file syncronously
 * @param {string} path
 * @param {string} contents
 * @returns {void}
 */
function writeTextFileSync(path, contents) {
  core.ops.op_write_file_sync(path, contents);
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
  readTextFile,
  writeTextFile,
  remove,
  readTextFileSync,
  writeTextFileSync,
  removeSync,
};
