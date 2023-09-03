use deno_core::{error::AnyError, op2};

// Read files
#[op2(async)]
#[buffer]
pub async fn op_read_file(#[string] path: String) -> Result<Vec<u8>, AnyError> {
    let contents = tokio::fs::read(path).await?;
    Ok(contents)
}

#[op2(async)]
#[string]
pub async fn op_read_text_file(#[string] path: String) -> Result<String, AnyError> {
    let contents = tokio::fs::read_to_string(path).await?;
    Ok(contents)
}

// Write files
#[op2(async)]
pub async fn op_write_file(
    #[string] path: String,
    #[buffer(copy)] contents: Vec<u8>,
) -> Result<(), AnyError> {
    tokio::fs::write(path, contents).await?;
    Ok(())
}

#[op2(async)]
pub async fn op_write_text_file(
    #[string] path: String,
    #[string] contents: String,
) -> Result<(), AnyError> {
    tokio::fs::write(path, contents).await?;
    Ok(())
}

// Remove files
#[op2(async)]
pub async fn op_remove_file(#[string] path: String) -> Result<(), AnyError> {
    tokio::fs::remove_file(path).await?;
    Ok(())
}

#[op2(async)]
pub async fn op_remove_dir(#[string] path: String, recursive: bool) -> Result<(), AnyError> {
    if recursive {
        tokio::fs::remove_dir_all(path).await?;
    } else {
        tokio::fs::remove_dir(path).await?;
    }

    Ok(())
}
