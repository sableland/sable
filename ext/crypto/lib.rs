use deno_core::{error::AnyError, op2};
use uuid::Uuid;

#[op2]
#[string]
pub fn op_crypto_new_uuidv4() -> Result<String, AnyError> {
    Ok(Uuid::new_v4().to_string())
}
