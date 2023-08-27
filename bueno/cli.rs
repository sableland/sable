extern crate clap;

use self::clap::{arg, Command};

use crate::bueno_run;

pub fn cli() -> Command {
    Command::new("buenojs")
        .about("THE JavaScript Runtime")
        .subcommand_required(true)
        .arg_required_else_help(true)
        .subcommand(
            Command::new("run")
                .about("Run module at specified path")
                .arg(arg!(<MODULE_PATH> "Module path to run"))
                .arg_required_else_help(true),
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

            if let Err(error) = runtime.block_on(bueno_run(&module_path)) {
                // TODO: better looking errors
                eprintln!("error: {}", error);
            }
        }
        _ => unreachable!(),
    }
}
