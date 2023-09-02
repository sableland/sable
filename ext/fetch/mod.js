const core = Bueno.core;

/**
 * Fetches a URL
 * @param {string} url
 * @returns {Promise<Response>}
 */
function fetch(url) {
  return core.ops.op_fetch(url);
}

Bueno.fetch = fetch;