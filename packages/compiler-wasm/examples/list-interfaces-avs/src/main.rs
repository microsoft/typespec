use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use wasmtime::component::{Component, Linker, ResourceTable};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder, WasiCtxView, WasiView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpView};
use walkdir::WalkDir;

const DEFAULT_ENTRY: &str =
    "/Users/cataggar/ms/azure-rest-api-specs/specification/vmware/resource-manager/Microsoft.AVS/AVS/client.tsp";

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

fn load_all_tsp_under(root_dir: &Path) -> Result<Vec<(PathBuf, String)>> {
    let mut out = Vec::new();
    for entry in WalkDir::new(root_dir).into_iter() {
        let entry = entry?;
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("tsp") {
            continue;
        }
        let contents = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read {}", path.display()))?;
        out.push((path.to_path_buf(), contents));
    }
    Ok(out)
}

fn to_posix_rel_path(path: &Path) -> String {
    path.to_string_lossy()
        .replace('\\', "/")
        .replace(std::path::MAIN_SEPARATOR, "/")
}

fn main() -> Result<()> {
    let entry = std::env::args().nth(1).unwrap_or_else(|| DEFAULT_ENTRY.to_string());
    let entry_path = PathBuf::from(entry);
    if !entry_path.exists() {
        bail!("entry file does not exist: {}", entry_path.display());
    }
    let entry_path = entry_path
        .canonicalize()
        .with_context(|| format!("failed to canonicalize {}", entry_path.display()))?;

    let entry_dir = entry_path
        .parent()
        .context("entry file has no parent directory")?
        .canonicalize()
        .context("failed to canonicalize entry directory")?;

    // Map the on-disk project directory to a virtual root.
    let virtual_root = "/project";
    let entry_rel = entry_path
        .strip_prefix(&entry_dir)
        .context("failed to relativize entry under its directory")?;
    let entry_virtual = format!("{virtual_root}/{}", to_posix_rel_path(entry_rel));

    // Provide all .tsp files under the entry directory so relative imports resolve.
    let disk_files = load_all_tsp_under(&entry_dir)?;
    let mut files: Vec<types::SourceFile> = Vec::with_capacity(disk_files.len());
    for (disk_path, contents) in disk_files {
        let rel = disk_path
            .strip_prefix(&entry_dir)
            .with_context(|| format!("failed to relativize {}", disk_path.display()))?;
        let virtual_path = format!("{virtual_root}/{}", to_posix_rel_path(rel));
        files.push(types::SourceFile {
            path: virtual_path,
            contents,
        });
    }

    // Locate component.
    let repo_root = repo_root()?;
    let component_path = repo_root.join("packages/compiler-wasm/build/typespec-compiler.wasm");
    if !component_path.exists() {
        bail!(
            "WASI component not found at {}. Build it first with `pnpm -C packages/compiler-wasm build:wasm`.",
            component_path.display()
        );
    }

    // Engine + component model
    let mut config = Config::new();
    config.wasm_component_model(true);
    let engine = Engine::new(&config).context("failed to create wasmtime engine")?;
    let component = Component::from_file(&engine, &component_path)
        .with_context(|| format!("failed to load component: {}", component_path.display()))?;

    // WASI (p2) + WASI HTTP wiring for the JS/WASI runtime inside the component.
    let mut linker: Linker<Host> = Linker::new(&engine);
    wasmtime_wasi::p2::add_to_linker_sync(&mut linker).context("failed to add WASI to linker")?;
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

    let result = typespec
        .call_list_interfaces_details_virtual(&mut store, &files, &entry_virtual)
        .context("list-interfaces-details-virtual trapped")?;

    if !result.diagnostics.is_empty() {
        eprintln!("diagnostics: {}", result.diagnostics.len());
        for d in result.diagnostics.iter() {
            eprintln!("{:?} {}: {}", d.severity, d.code, d.message);
        }
    }

    for iface in result.interfaces {
        println!("{}", iface.name);
        for op in iface.operations {
            println!("  - {}", op);
        }
    }

    Ok(())
}
