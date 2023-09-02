use deno_core::{error::AnyError, op, JsBuffer, ToJsBuffer};

// Read files
#[op]
pub async fn op_read_file(path: String) -> Result<ToJsBuffer, AnyError> {
    let contents = tokio::fs::read(path).await?;
    Ok(contents.into())
}

#[op]
pub fn op_read_file_sync(path: String) -> Result<ToJsBuffer, AnyError> {
    let contents = std::fs::read(path)?;
    Ok(contents.into())
}

#[op]
pub async fn op_read_text_file(path: String) -> Result<String, AnyError> {
    let contents = tokio::fs::read_to_string(path).await?;
    Ok(contents)
}

#[op]
pub fn op_read_text_file_sync(path: String) -> Result<String, AnyError> {
    let contents = std::fs::read_to_string(path)?;
    Ok(contents)
}

// Write files
#[op]
pub async fn op_write_file(path: String, contents: JsBuffer) -> Result<(), AnyError> {
    tokio::fs::write(path, contents).await?;
    Ok(())
}

#[op]
pub fn op_write_file_sync(path: String, contents: JsBuffer) -> Result<(), AnyError> {
    std::fs::write(path, contents)?;
    Ok(())
}

#[op]
pub async fn op_write_text_file(path: String, contents: String) -> Result<(), AnyError> {
    tokio::fs::write(path, contents).await?;
    Ok(())
}

#[op]
pub fn op_write_text_file_sync(path: String, contents: String) -> Result<(), AnyError> {
    std::fs::write(path, contents)?;
    Ok(())
}

// Remove files
#[op]
pub async fn op_remove_file(path: String) -> Result<(), AnyError> {
    tokio::fs::remove_file(path).await?;
    Ok(())
}

#[op]
pub fn op_remove_file_sync(path: String) -> Result<(), AnyError> {
    std::fs::remove_file(path)?;
    Ok(())
}

#[op]
pub async fn op_remove_dir(path: String, recursive: bool) -> Result<(), AnyError> {
    if recursive {
        tokio::fs::remove_dir_all(path).await?;
    } else {
        tokio::fs::remove_dir(path).await?;
    }

    Ok(())
}

#[op]
pub fn op_remove_dir_sync(path: String, recursive: bool) -> Result<(), AnyError> {
    if recursive {
        std::fs::remove_dir_all(path)?;
    } else {
        std::fs::remove_dir(path)?;
    }

    Ok(())
}
