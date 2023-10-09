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

#[op2(async)]
pub async fn op_copy_file(#[string] origin: String, #[string] dest: String) -> Result<(), AnyError> {
    tokio::fs::copy(origin, dest).await?;
    Ok(())
}

#[op2(async)]
pub async fn op_copy_dir(#[string] origin: String, #[string] dest: String) -> Result<(), AnyError> {
    print!("got here");
    op_copy_dir_recurse(origin, dest).await?;
    Ok(())
}

use async_recursion::async_recursion;
#[async_recursion]
pub async fn op_copy_dir_recurse(origin: String, dest: String) -> Result<(), AnyError> {
    let orgForMetadata = origin.clone();
    let attr = tokio::fs::metadata(orgForMetadata);
    let dirBool = attr.await?.is_dir();
    print!("attributes : {:?}\n", dirBool);
    if dirBool {  

        let destForCreate = dest.clone();
        tokio::fs::create_dir(destForCreate).await?;

        let mut entries = tokio::fs::read_dir(origin).await?;
        while let Some(entry) = entries.next_entry().await? {

            let mut next = dest.to_owned();

            let wholePathStr = entry.path().into_os_string().into_string().unwrap().clone();
            print!("entry path : {}\n", entry.path().into_os_string().into_string().unwrap());
            let parts = wholePathStr.split("/");
            let itemStr = parts.last().unwrap();

            print!("item = {}\n", itemStr);
            next.push_str(&"/");
            next.push_str(&itemStr);
            print!("next : {}\n", next);
            op_copy_dir_recurse(entry.path().into_os_string().into_string().unwrap(), next).await?;
        }
    } else {
        tokio::fs::copy(origin, dest).await?;
    }
    Ok(())
}