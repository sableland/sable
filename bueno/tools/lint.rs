use deno_core::error::AnyError;
use glob::glob;
use oxc_allocator::Allocator;
use oxc_ast::AstKind;
use oxc_diagnostics::{
    miette::{self, Diagnostic},
    thiserror::Error,
};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use oxc_span::{SourceType, Span};
use std::ffi::OsStr;
use std::path::Path;

pub struct LintOptions<'a> {
    pub glob: &'a String,
}

pub fn lint(options: LintOptions) -> Result<bool, AnyError> {
    let mut no_errors = false;

    for entry in glob(&options.glob)? {
        match entry {
            Ok(path) => match path.extension().and_then(OsStr::to_str) {
                Some("js" | "ts" | "jsx" | "tsx") => {
                    no_errors = lint_file(path.as_path())? || no_errors;
                }
                _ => {}
            },
            Err(e) => println!("{:?}", e),
        }
    }

    Ok(no_errors)
}

fn lint_file(path: &Path) -> Result<bool, AnyError> {
    let source_text = std::fs::read_to_string(path)?;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap();
    let ret = Parser::new(&allocator, &source_text, source_type).parse();

    // Handle parser errors
    if !ret.errors.is_empty() {
        println!("[{}]", path.display());
        print_errors(&source_text, ret.errors);
        return Ok(false);
    }

    let program = allocator.alloc(ret.program);
    let semantic_ret = SemanticBuilder::new(&source_text, source_type)
        .with_trivias(ret.trivias)
        .build(program);

    let mut errors: Vec<oxc_diagnostics::Error> = vec![];

    for node in semantic_ret.semantic.nodes().iter() {
        match node.kind() {
            AstKind::ArrayPattern(array) if array.elements.is_empty() => {
                errors.push(NoEmptyPattern("array", array.span).into());
            }
            AstKind::ObjectPattern(object) if object.properties.is_empty() => {
                errors.push(NoEmptyPattern("object", object.span).into());
            }
            _ => {}
        }
    }

    if !errors.is_empty() {
        println!("[{}]", path.display());
        print_errors(&source_text, errors);
        return Ok(false);
    }

    Ok(true)
}

fn print_errors(source_text: &str, errors: Vec<oxc_diagnostics::Error>) {
    for error in errors {
        let error = error.with_source_code(source_text.to_string());
        println!("{error:?}");
    }
}

#[derive(Debug, Error, Diagnostic)]
#[error("empty destructuring pattern is not allowed")]
#[diagnostic(severity(warning))]
struct NoEmptyPattern(&'static str, #[label("Empty {0} binding pattern")] pub Span);
