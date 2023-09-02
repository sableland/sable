use deno_core::{error::AnyError, op, op2};

// Read files
#[op2(async)]
#[buffer]
pub async fn op_read_file(#[string] path: String) -> Result<Vec<u8>, AnyError> {
    let contents = tokio::fs::read(path).await?;
    Ok(contents)
}

#[op2]
#[buffer]
pub fn op_read_file_sync(#[string] path: String) -> Result<Vec<u8>, AnyError> {
    let contents = std::fs::read(path)?;
    Ok(contents)
}

// TODO: Convert it to op2
#[op]
pub async fn op_read_text_file(path: String) -> Result<String, AnyError> {
    let contents = tokio::fs::read_to_string(path).await?;
    Ok(contents)
}

#[op2]
#[string]
pub fn op_read_text_file_sync(#[string] path: String) -> Result<String, AnyError> {
    let contents = std::fs::read_to_string(path)?;
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

#[op2(fast)]
pub fn op_write_file_sync(
    #[string] path: String,
    #[buffer(copy)] contents: Vec<u8>,
) -> Result<(), AnyError> {
    std::fs::write(path, contents)?;
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

#[op2(fast)]
pub fn op_write_text_file_sync(
    #[string] path: String,
    #[string] contents: String,
) -> Result<(), AnyError> {
    std::fs::write(path, contents)?;
    Ok(())
}

// Remove files
#[op2(async)]
pub async fn op_remove_file(#[string] path: String) -> Result<(), AnyError> {
    tokio::fs::remove_file(path).await?;
    Ok(())
}

#[op2(fast)]
pub fn op_remove_file_sync(#[string] path: String) -> Result<(), AnyError> {
    std::fs::remove_file(path)?;
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

#[op2(fast)]
pub fn op_remove_dir_sync(#[string] path: String, recursive: bool) -> Result<(), AnyError> {
    if recursive {
        std::fs::remove_dir_all(path)?;
    } else {
        std::fs::remove_dir(path)?;
    }

    Ok(())
}
