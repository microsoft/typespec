use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use wasmtime::component::{Component, Linker, ResourceTable};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder, WasiCtxView, WasiView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpView};
use walkdir::WalkDir;

wasmtime::component::bindgen!({
    path: "../../typespec.wit",
    world: "typespec",
});

use crate::typespec::component::types;

struct Host {
    table: ResourceTable,
    wasi: WasiCtx,
    http: WasiHttpCtx,
}

impl WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
        }
    }
}

impl WasiHttpView for Host {
    fn ctx(&mut self) -> &mut WasiHttpCtx {
        &mut self.http
    }

    fn table(&mut self) -> &mut ResourceTable {
        &mut self.table
    }
}

fn repo_root() -> Result<PathBuf> {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    Ok(here
        .join("../../../..")
        .canonicalize()
        .context("failed to resolve repo root")?)
}

fn collect_tsp_files(stdlib_dir: &Path) -> Result<Vec<types::SourceFile>> {
    let mut files = Vec::new();

    for entry in WalkDir::new(stdlib_dir).into_iter() {
        let entry = entry?;
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("tsp") {
            continue;
        }

        let rel = path
            .strip_prefix(stdlib_dir)
            .context("failed to relativize stdlib file")?
            .to_string_lossy()
            .to_string();

        // Ensure POSIX separators inside the virtual FS.
        // Ensure POSIX separators inside the virtual FS.
        let rel = rel.replace('\\', "/").replace(std::path::MAIN_SEPARATOR, "/");
        let virtual_path = format!("/lib/{rel}");

        let contents = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read stdlib file: {}", path.display()))?;

        files.push(types::SourceFile {
            path: virtual_path,
            contents,
        });
    }

    Ok(files)
}

fn main() -> Result<()> {
    // Paths
    let repo_root = repo_root()?;
    let stdlib_dir = repo_root.join("packages/compiler/lib");
    let component_path = repo_root.join("packages/compiler-wasm/build/typespec-compiler.wasm");

    if !component_path.exists() {
        bail!(
            "WASI component not found at {}. Build it first with `pnpm -C packages/compiler-wasm build:wasm`.",
            component_path.display()
        );
    }

    // Load stdlib .tsp into virtual /lib/**
    let mut files = collect_tsp_files(&stdlib_dir)?;
    files.push(types::SourceFile {
        path: "/main.tsp".to_string(),
        contents: "namespace MyService { op test(): void; }\n".to_string(),
    });

    // Engine + component model
    let mut config = Config::new();
    config.wasm_component_model(true);

    let engine = Engine::new(&config).context("failed to create wasmtime engine")?;
    let component = Component::from_file(&engine, &component_path)
        .with_context(|| format!("failed to load component: {}", component_path.display()))?;

    // WASI (p2) wiring for the JS/WASI runtime inside the component.
    let mut linker: Linker<Host> = Linker::new(&engine);
    wasmtime_wasi::p2::add_to_linker_sync(&mut linker)
        .context("failed to add WASI to linker")?;
    wasmtime_wasi_http::add_only_http_to_linker_sync(&mut linker)
        .context("failed to add WASI HTTP to linker")?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let host = Host {
        table: ResourceTable::new(),
        wasi,
        http: WasiHttpCtx::new(),
    };

    let mut store = Store::new(&engine, host);

    let typespec = Typespec::instantiate(&mut store, &component, &linker)
        .context("failed to instantiate typespec component")?;

    let options = types::CompileOptions {
        emitters: Vec::new(),
        output_dir: "/output".to_string(),
        arguments: Vec::new(),
    };

    let result = typespec
        .call_compile_virtual(&mut store, &files, "/main.tsp", &options)
        .context("compile-virtual trapped")?;

    println!("success: {}", result.success);
    println!("diagnostics: {}", result.diagnostics.len());

    for d in result.diagnostics.iter().take(20) {
        println!("{:?} {}", d.severity, d.code);
        println!("  {}", d.message);
    }

    if !result.success {
        bail!("compile-virtual failed");
    }

    Ok(())
}
