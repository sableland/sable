pub mod extensions {
    deno_core::extension!(
        bueno,
        esm_entry_point = "ext:bueno/runtime.js",
        esm = [
            "bueno.js",
            "console.js",
            "runtime.js",
            "io/mod.js",
            "io/stdio.js",
        ],
    );

    deno_core::extension!(
        bueno_cleanup,
        esm_entry_point = "ext:bueno_cleanup/cleanup.js",
        esm = ["cleanup.js",],
    );
}
