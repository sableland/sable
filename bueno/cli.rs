extern crate clap;

use clap::ArgAction;

use self::clap::{arg, Arg, Command};

use crate::{
    bueno_run,
    fmt::{fmt, FormatOptions},
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
                .arg(arg!([glob] "Global pattern to format")),
        )
}

pub fn parse_cli() {
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
            }
        }
        Some(("fmt", _)) => {
            if let Err(error) = fmt(FormatOptions {
                check: false,
                glob: "**/*",
            }) {
                eprintln!("error: {}", error);
            }
        }
        _ => unreachable!(),
    }
}
