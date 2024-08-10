use deno_core::{
    anyhow::{anyhow, Result},
    op2, OpState,
};
use rusqlite::{Connection, OptionalExtension};
use std::path::PathBuf;

#[derive(Debug)]
pub struct LocalStoragePath(pub PathBuf);

struct LocalStorage(Connection);
struct SessionStorage(Connection);

// 5 MiB per Storage
const STORAGE_SIZE_LIMIT: usize = 5 * 1024 * 1024;

/// Creates a "storage" table if it doesn't already exist in given connection
fn prepare_new_connection(connection: &Connection) -> Result<()> {
    connection.execute(
        "CREATE TABLE IF NOT EXISTS storage (key varchar NOT NULL UNIQUE, value varchar NOT NULL)",
        [],
    )?;
    Ok(())
}

/// Retrieves rusqlite's Connection from state to given storage:
///  - SessionStorage (in memory connection) if session is true
///  - LocalStorage (persistent on disk) if session is false
fn get_connection(state: &mut OpState, session: bool) -> Result<&Connection> {
    if session {
        if state.try_borrow::<SessionStorage>().is_none() {
            let connection = Connection::open_in_memory()?;
            prepare_new_connection(&connection)?;
            let storage = SessionStorage(connection);
            state.put(storage);
        };

        let storage = state.borrow::<SessionStorage>();
        Ok(&storage.0)
    } else {
        if state.try_borrow::<LocalStorage>().is_none() {
            let path = state
                .borrow::<Option<LocalStoragePath>>()
                .as_ref()
                .ok_or(anyhow!(
                "Couldn't connect to LocalStorage as LocalStoragePath has not been found in the OpState"
            ))?;
            let path = &path.0;

            std::fs::create_dir_all(path)?;

            let connection = Connection::open(path.join("local_storage.sl3"))?;
            prepare_new_connection(&connection)?;
            let storage = LocalStorage(connection);

            state.put(storage);
        }

        let storage = state.borrow::<LocalStorage>();
        Ok(&storage.0)
    }
}

#[op2(fast)]
pub fn op_webstorage_length(state: &mut OpState, session: bool) -> Result<u32> {
    let connection = get_connection(state, session)?;

    let mut statement = connection.prepare_cached("SELECT COUNT(*) FROM storage")?;
    let count = statement.query_row([], |row| row.get(0))?;

    Ok(count)
}

#[op2]
#[string]
/// Retrieves index-th key from a Storage
pub fn op_webstorage_key(state: &mut OpState, index: u32, session: bool) -> Result<Option<String>> {
    let connection = get_connection(state, session)?;

    let mut statement = connection.prepare_cached("SELECT value FROM storage LIMIT 1 OFFSET ?1")?;
    let value = statement.query_row([index], |row| row.get(0)).optional()?;

    Ok(value)
}

#[op2]
#[string]
pub fn op_webstorage_get_item(
    state: &mut OpState,
    #[string] key: String,
    session: bool,
) -> Result<Option<String>> {
    let connection = get_connection(state, session)?;

    let mut statement = connection.prepare_cached("SELECT value FROM storage WHERE key = ?1")?;
    let value = statement.query_row([key], |row| row.get(0)).optional()?;

    Ok(value)
}

#[op2(fast)]
pub fn op_webstorage_set_item(
    state: &mut OpState,
    #[string] key: String,
    #[string] value: String,
    session: bool,
) -> Result<()> {
    let connection = get_connection(state, session)?;

    let mut statement =
        connection.prepare_cached(r#"SELECT SUM(pgsize) FROM dbstat WHERE name="storage";"#)?;
    let size = statement.query_row([], |row| row.get::<_, usize>(0))?;
    let predicted_payload_size = key.len() + value.len();

    if size + predicted_payload_size >= STORAGE_SIZE_LIMIT {
        // TODO(Im-Beast): Replace with DOMException
        return Err(anyhow!("QuotaExceededError"));
    }

    let mut statement =
        connection.prepare_cached("INSERT OR REPLACE INTO storage VALUES (?1, ?2)")?;
    statement.execute([key, value])?;

    Ok(())
}

#[op2(fast)]
pub fn op_webstorage_remove_item(
    state: &mut OpState,
    #[string] key: String,
    session: bool,
) -> Result<()> {
    let connection = get_connection(state, session)?;

    let mut statement = connection.prepare_cached("DELETE FROM storage WHERE key = ?1")?;
    statement.execute([key])?;

    Ok(())
}

#[op2(fast)]
/// Deletes every entry from Storage
pub fn op_webstorage_clear(state: &mut OpState, session: bool) -> Result<()> {
    let connection = get_connection(state, session)?;

    let mut statement = connection.prepare_cached("DELETE FROM storage")?;
    statement.execute([])?;

    Ok(())
}

#[op2]
#[serde]
/// Retrieves all keys from Storage
pub fn op_webstorage_keys<'a>(state: &mut OpState, session: bool) -> Result<Vec<String>> {
    let connection = get_connection(state, session)?;

    let mut statement = connection.prepare_cached("SELECT key FROM storage")?;
    let keys = statement
        .query_map::<String, _, _>([], |row| row.get(0))?
        .collect::<Result<Vec<String>, rusqlite::Error>>()?;

    Ok(keys)
}
