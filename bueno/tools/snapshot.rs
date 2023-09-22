use std::path::PathBuf;

pub fn snapshot(module_path: &String) {
    let module_path = PathBuf::from(module_path);
    let name = module_path.file_name().unwrap().to_str().unwrap();
}
