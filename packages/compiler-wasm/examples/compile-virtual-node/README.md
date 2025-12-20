# compile-virtual-node

Runs `compileVirtual` from `@typespec/compiler-wasm` using an in-memory file set.

This example loads the TypeSpec standard library sources from `packages/compiler/lib/**` and maps them into the virtual filesystem under `/lib/**`.

## Run

From the repo root:

- Build the package: `pnpm -C packages/compiler-wasm build`
- Run the example: `node packages/compiler-wasm/examples/compile-virtual-node/run.mjs`
