use deno_core::error::AnyError;
use dprint_plugin_typescript::configuration::ConfigurationBuilder;
use glob::glob;
use std::ffi::OsStr;

// fn format_file(path: &str) -> Result<(), AnyError> {
//   let contents = std::fs::read_to_string(path)?;
//   println!("fmt: {}", path);
//   Ok(())
// }

pub struct FormatOptions<'a> {
    pub check: bool,
    pub glob: &'a str,
}

pub fn fmt(options: FormatOptions) -> Result<(), AnyError> {
    for entry in glob(&options.glob)? {
        match entry {
            Ok(path) => {
                if let Some(ext) = path.extension().and_then(OsStr::to_str) {
                    match ext {
                        "js" | "ts" | "jsx" | "tsx" => {
                            let contents = std::fs::read_to_string(path.clone())?;

                            let result = dprint_plugin_typescript::format_text(
                                &path,
                                &contents,
                                &ConfigurationBuilder::new().line_width(80).build(),
                            )?;

                            if let Some(text) = result {
                                println!("fmt: {}", path.display());
                                // print out formatted text
                                std::fs::write(path, text)?;
                            }
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => println!("{:?}", e),
        }
    }

    Ok(())
}
