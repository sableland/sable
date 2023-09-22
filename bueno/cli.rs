extern crate clap;

use clap::ArgAction;
use std::process::ExitCode;

use self::clap::{arg, Arg, Command};

use crate::{
    bueno_run,
    tools::fmt::{fmt, FormatOptions},
    BuenoOptions,
};

pub fn cli() -> Command {
    Command::new("buenojs")
        .about("THE JavaScript Runtime")
        .subcommand_required(true)
        .arg_required_else_help(true)
        .subcommand(
            Command::new("run")
                .about("Run module at specified path")
                .arg(arg!(<MODULE_PATH> "Module path to run"))
                .arg_required_else_help(true)
                .arg(
                    Arg::new("reload-cache")
                        .long("reload-cache")
                        .short('r')
                        .action(ArgAction::SetTrue)
                        .help("Reload cache of the ran module")
                        .conflicts_with("clean-cache"),
                )
                .arg(
                    Arg::new("clean-cache")
                        .long("clean-cache")
                        .action(ArgAction::SetTrue)
                        .help("Delete cache of all modules")
                        .conflicts_with("reload-cache"),
                ),
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

pub fn parse_cli() -> ExitCode {
    let mut code = ExitCode::SUCCESS;
    let matches = cli().get_matches();

    match matches.subcommand() {
        Some(("run", sub_matches)) => {
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap();

            let module_path = sub_matches
                .get_one::<String>("MODULE_PATH")
                .expect("Required");

            let options = BuenoOptions {
                reload_cache: sub_matches.get_flag("reload-cache"),
                clean_cache: sub_matches.get_flag("clean-cache"),
            };

            if let Err(error) = runtime.block_on(bueno_run(&module_path, options)) {
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

            if let Err(error) = fmt(FormatOptions { check, glob }) {
                eprintln!("error: {}", error);
                code = ExitCode::FAILURE;
            }
        }
        _ => unreachable!(),
    }
    code
}
