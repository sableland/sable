use deno_core::error::AnyError;
use dprint_plugin_json;
use dprint_plugin_markdown;
use dprint_plugin_markdown::configuration::TextWrap;
use dprint_plugin_typescript;
use dprint_plugin_typescript::configuration::{QuoteProps, SortOrder};
use glob::glob;
use std::ffi::OsStr;
use std::path::Path;

// TODO(lino-levan): Make typescript/json/markdown global static variables when `LazyCell` is stable.
// https://doc.rust-lang.org/std/cell/struct.LazyCell.html

fn format_typescript_file(path: &Path, contents: &str) -> Result<Option<String>, AnyError> {
    dprint_plugin_typescript::format_text(
        path,
        contents,
        &dprint_plugin_typescript::configuration::ConfigurationBuilder::new()
            .deno()
            .use_tabs(true)
            .quote_props(QuoteProps::AsNeeded)
            .comment_line_force_space_after_slashes(true)
            .ignore_node_comment_text("bueno-fmt-ignore")
            .ignore_file_comment_text("bueno-fmt-ignore-file")
            .module_sort_import_declarations(SortOrder::CaseInsensitive)
            .module_sort_export_declarations(SortOrder::CaseInsensitive)
            .build(),
    )
}

fn format_json_file(path: &Path, contents: &str) -> Result<Option<String>, AnyError> {
    dprint_plugin_json::format_text(
        path,
        contents,
        &dprint_plugin_json::configuration::ConfigurationBuilder::new()
            .line_width(80)
            .use_tabs(true)
            .ignore_node_comment_text("bueno-fmt-ignore")
            .comment_line_force_space_after_slashes(true)
            .build(),
    )
}

fn format_markdown_file(path: &Path, contents: &str) -> Result<Option<String>, AnyError> {
    dprint_plugin_markdown::format_text(
        &contents,
        &dprint_plugin_markdown::configuration::ConfigurationBuilder::new()
            .text_wrap(TextWrap::Always)
            .ignore_directive("bueno-fmt-ignore")
            .ignore_start_directive("bueno-fmt-ignore-start")
            .ignore_end_directive("bueno-fmt-ignore-end")
            .ignore_file_directive("bueno-fmt-ignore-file")
            .build(),
        |tag, text, _line_number| format_file(path, tag, text),
    )
}

fn format_file(path: &Path, ext: &str, contents: &str) -> Result<Option<String>, AnyError> {
    match ext {
        "js" | "ts" | "jsx" | "tsx" => format_typescript_file(path, contents),
        "json" | "jsonc" => format_json_file(path, contents),
        "md" | "markdown" => format_markdown_file(path, contents),
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
                    let contents = std::fs::read_to_string(&path)?;
                    if let Some(text) = format_file(&path, ext, &contents)? {
                        println!("Formatted: {}", path.display());
                        if !options.check {
                            // TODO(Im-Beast): Use atomic writes to make sure files are safely written
                            std::fs::write(path, text)?;
                        }
                    }
                }
                _ => {}
            },
            Err(e) => eprintln!("{:?}", e),
        }
    }

    Ok(())
}
