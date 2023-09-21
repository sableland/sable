use deno_core::error::AnyError;
use dprint_plugin_json;
use dprint_plugin_markdown;
use dprint_plugin_typescript;
use glob::glob;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

// TODO(lino-levan): Make typescript/json/markdown global static variables when `LazyCell` is stable.
// https://doc.rust-lang.org/std/cell/struct.LazyCell.html

fn fake_path(ext: &str) -> PathBuf {
    let file_name = format!("file.{}", ext);
    PathBuf::from(file_name)
}

fn format_typescript_file(path: &Path, contents: &str) -> Result<Option<String>, AnyError> {
    dprint_plugin_typescript::format_text(
        path,
        contents,
        &dprint_plugin_typescript::configuration::ConfigurationBuilder::new()
            .line_width(80)
            .build(),
    )
}

fn format_json_file(contents: &str) -> Result<Option<String>, AnyError> {
    dprint_plugin_json::format_text(
        &contents,
        &dprint_plugin_json::configuration::ConfigurationBuilder::new()
            .line_width(80)
            .build(),
    )
}

fn format_markdown_file(contents: &str) -> Result<Option<String>, AnyError> {
    dprint_plugin_markdown::format_text(
        &contents,
        &dprint_plugin_markdown::configuration::ConfigurationBuilder::new()
            .line_width(80)
            .build(),
        |tag, text, _line_number| format_file(tag, text),
    )
}

fn format_file(ext: &str, contents: &str) -> Result<Option<String>, AnyError> {
    match ext {
        "js" | "ts" | "jsx" | "tsx" => format_typescript_file(fake_path(ext).as_path(), &contents),
        "json" | "jsonc" => format_json_file(&contents),
        "md" | "markdown" => format_markdown_file(&contents),
        _ => Ok(None),
    }
}

pub struct FormatOptions<'a> {
    pub check: bool,
    pub glob: &'a String,
}

pub fn fmt(options: FormatOptions) -> Result<(), AnyError> {
    for entry in glob(&options.glob)? {
        match entry {
            Ok(path) => match path.extension().and_then(OsStr::to_str) {
                Some(
                    ext @ ("js" | "ts" | "jsx" | "tsx" | "json" | "jsonc" | "md" | "markdown"),
                ) => {
                    let contents = std::fs::read_to_string(path.clone())?;

                    if let Some(text) = format_file(ext, &contents)? {
                        println!("fmt: {}", path.display());
                        if !options.check {
                            std::fs::write(path, text)?;
                        }
                    }
                }
                _ => {}
            },
            Err(e) => println!("{:?}", e),
        }
    }

    Ok(())
}
