import {
  op_crypto_new_uuidv4
} from "ext:core/ops";

class Crypto {
  static #created = false;
  constructor() {
    if (Crypto.#created) {
      throw new TypeError("Illegal constructor");
    }
    Crypto.#created = true;
  }

  randomUUID() {
    return op_crypto_new_uuidv4();
  }
}

globalThis.Crypto = Crypto;

globalThis.crypto = new Crypto();
