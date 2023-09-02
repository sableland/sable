use deno_core::{error::AnyError, op2};

#[op2(async)]
#[string]
pub async fn op_fetch(#[string] url: String) -> Result<String, AnyError> {
    let res = reqwest::get(url).await?.text().await?;
    Ok(res)
}
