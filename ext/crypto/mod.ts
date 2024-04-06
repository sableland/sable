import {
  op_crypto_new_uuidv4
} from "ext:core/ops";

globalThis.crypto = {
  randomUUID() {
    return op_crypto_new_uuidv4();
  }
}
