# compile-virtual (wasmtime)

Minimal example that runs the **WASI component** produced by `@typespec/compiler-wasm` using `wasmtime` (Rust host).

It calls the component export `compile-virtual`, providing:
- all TypeSpec stdlib `.tsp` files mounted under `/lib/**`
- a tiny `/main.tsp`

## Run

From the repository root:

```bash
pnpm -C packages/compiler-wasm build:wasm

cd packages/compiler-wasm/examples/compile-virtual-wasmtime
cargo run
```

Expected output:

```text
success: true
diagnostics: 0
```
