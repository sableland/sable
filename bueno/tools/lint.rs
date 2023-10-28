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
use std::path::Path;
use std::rc::Rc;
use std::{collections::HashMap, ffi::OsStr};

pub struct LintOptions<'a> {
    pub glob: &'a String,
}

pub enum LinterResult {
    Ok,
    Errors(HashMap<Rc<Path>, Vec<oxc_diagnostics::Error>>),
}

pub fn lint(options: LintOptions) -> Result<LinterResult, AnyError> {
    let mut errors: HashMap<Rc<Path>, Vec<oxc_diagnostics::Error>> = HashMap::new();

    for entry in glob(&options.glob)? {
        match entry {
            Ok(path) => match path.extension().and_then(OsStr::to_str) {
                Some("js" | "ts" | "jsx" | "tsx") => {
                    let lint_errors = lint_file(path.as_path())?;

                    if lint_errors.is_empty() {
                        continue;
                    }

                    errors.insert(Rc::from(path), lint_errors);
                }
                _ => {}
            },
            Err(e) => eprintln!("{:?}", e),
        }
    }

    if errors.is_empty() {
        Ok(LinterResult::Ok)
    } else {
        Ok(LinterResult::Errors(errors))
    }
}

fn lint_file(path: &Path) -> Result<Vec<oxc_diagnostics::Error>, AnyError> {
    let source_text = std::fs::read_to_string(path)?;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap();
    let ret = Parser::new(&allocator, &source_text, source_type).parse();

    // Handle parser errors
    if !ret.errors.is_empty() {
        return Ok(ret.errors);
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

    Ok(errors)
}

pub fn print_errors(source_text: &str, errors: Vec<oxc_diagnostics::Error>) {
    for error in errors {
        let error = error.with_source_code(source_text.to_string());
        eprintln!("{error:?}");
    }
}

#[derive(Debug, Error, Diagnostic)]
#[error("empty destructuring pattern is not allowed")]
#[diagnostic(severity(warning))]
struct NoEmptyPattern(&'static str, #[label("Empty {0} binding pattern")] pub Span);
