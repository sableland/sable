extern crate clap;

use std::str::FromStr;

use clap::ArgAction;
use sable_ext::extensions::runtime::RuntimeState;
use std::process::ExitCode;

use self::clap::{arg, Arg, Command};

use crate::{
    sable_run,
    tools::fmt::{fmt, FormatOptions},
    SableOptions,
};

pub fn cli() -> Command {
    let reload_cache_arg = Arg::new("reload-cache")
        .long("reload-cache")
        .short('r')
        .action(ArgAction::SetTrue)
        .help("Reload cache of the ran module")
        .conflicts_with("clean-cache");

    let clean_cache_arg = Arg::new("clean-cache")
        .long("clean-cache")
        .action(ArgAction::SetTrue)
        .help("Delete cache of all modules")
        .conflicts_with("reload-cache");

    Command::new("sable")
        .about("THE JavaScript Runtime")
        .subcommand_required(true)
        .arg_required_else_help(true)
        .subcommand(
            Command::new("run")
                .about("Run module at specified path")
                .arg(arg!(<MODULE_PATH> "Module path to run"))
                .arg_required_else_help(true)
                .arg(&reload_cache_arg)
                .arg(&clean_cache_arg),
        )
        // TODO(Im-Beast): Automatically find and test *.test.{ts,js} files by default
        .subcommand(
            Command::new("test")
                .about("Run tests in given module")
                .arg(arg!(<MODULE_PATH> "Module path to test"))
                .arg_required_else_help(true)
                .arg(&reload_cache_arg)
                .arg(&clean_cache_arg),
        )
        // TODO(Im-Beast): Automatically find and bench *.bench.{ts,js} files by default
        .subcommand(
            Command::new("bench")
                .about("Run benchmarks in given module")
                .arg(arg!(<MODULE_PATH> "Module path to bench"))
                .arg_required_else_help(true)
                .arg(reload_cache_arg)
                .arg(clean_cache_arg),
        )
        .subcommand(
            Command::new("fmt")
                .about("Format files given a global patern")
                .arg(arg!([glob] "Global pattern to format"))
                .arg(
                    Arg::new("check")
                        .long("check")
                        .action(ArgAction::SetTrue)
                        .help("Disables formatting and checks if files are formatted"),
                ),
        )
}

pub async fn parse_cli() -> ExitCode {
    let mut code = ExitCode::SUCCESS;
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some((subcommand @ "run", sub_matches))
        | Some((subcommand @ "test", sub_matches))
        | Some((subcommand @ "bench", sub_matches)) => {
            let module_path = sub_matches
                .get_one::<String>("MODULE_PATH")
                .expect("Required");

            let options = SableOptions {
                reload_cache: sub_matches.get_flag("reload-cache"),
                clean_cache: sub_matches.get_flag("clean-cache"),
                state: RuntimeState::from_str(subcommand).unwrap(),
            };

            if let Err(error) = sable_run(&module_path, options).await {
                // TODO: better looking errors
                eprintln!("error: {}", error);
                code = ExitCode::FAILURE;
            }
        }
        Some(("fmt", sub_matches)) => {
            let check = sub_matches.get_flag("check");
            let default_glob = "**/*".to_string();
            let glob = sub_matches
                .get_one::<String>("glob")
                .unwrap_or(&default_glob);

            if let Err(error) = fmt(FormatOptions::new(check, glob)).await {
                eprintln!("error: {}", error);
                code = ExitCode::FAILURE;
            }
        }
        Some((subcommand, _)) => unimplemented!("Subcommand {subcommand} is not implemented yet"),
        _ => unreachable!(""),
    }
    code
}
