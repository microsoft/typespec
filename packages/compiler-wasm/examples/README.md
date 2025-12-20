# compiler-wasm examples

- `compile-virtual-node`: Node.js example that loads stdlib sources into the virtual file set and calls `compileVirtual`.
- `compile-virtual-wasmtime`: Rust + wasmtime example that runs the WASI component (`build/typespec-compiler.wasm`) and calls `compile-virtual`.
