# list-interfaces-avs

Rust + wasmtime example that runs the TypeSpec WASI component and prints `interface` declarations using the TypeSpec parser API.

## Run

From repo root:

1. Build the component:

- `pnpm -C packages/compiler-wasm build:wasm`

2. Run the Rust host:

- `cargo run --manifest-path packages/compiler-wasm/examples/list-interfaces-avs/Cargo.toml`

Optionally pass a different entry file path:

- `cargo run --manifest-path packages/compiler-wasm/examples/list-interfaces-avs/Cargo.toml -- /path/to/entry.tsp`

## Default entry

By default it scans:

- `/Users/cataggar/ms/azure-rest-api-specs/specification/vmware/resource-manager/Microsoft.AVS/AVS/client.tsp`
