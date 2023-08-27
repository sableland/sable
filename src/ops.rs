use deno_core::{op, error::AnyError};

// Read files
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