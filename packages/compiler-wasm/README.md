# @typespec/compiler-wasm

WebAssembly Component packaging of the TypeSpec compiler for embedding in WASI-based hosts.

## Overview

This package provides a WebAssembly Component Model implementation of the TypeSpec compiler, enabling other WebAssembly components (e.g., Rust applications) to compile TypeSpec projects without requiring Node.js.

## Features

- **Component Model**: Built using `jco` (JavaScript Component tooling) for standards-compliant WebAssembly components
- **Virtual Filesystem**: Compile TypeSpec from in-memory source files
- **WASI Support**: Planned support for filesystem-based compilation via WASI
- **Minimal Surface**: Exposes only essential compilation APIs

## Architecture

The package leverages TypeSpec's existing `CompilerHost` abstraction to isolate platform-specific operations:

- **Virtual FS Host**: In-memory filesystem for `compile-virtual` function
- **WASI Host**: (Planned) WASI-backed filesystem for `compile-root` function
- **ESM Bundle**: Tree-shaken bundle of the TypeSpec compiler runtime (standard library source files are not bundled yet)
- **WIT Interface**: Component Model interface definition

## WIT Interface

The component exposes two main functions:

```wit
world typespec {
  export compile-virtual: func(
    files: list<source-file>,
    entry: string,
    options: compile-options
  ) -> compile-result;

  export compile-root: func(
    root-path: string,
    entry: string,
    options: compile-options
  ) -> compile-result;
}
```

See [`typespec.wit`](./typespec.wit) for the complete interface definition.

## Building

### Prerequisites

- Node.js 20 LTS or later
- pnpm

### Build Steps

```bash
# Install dependencies (from repository root)
pnpm install

# Build the package
cd packages/compiler-wasm
pnpm build

# Create WebAssembly component
pnpm build:wasm
```

This produces:

- `dist/bundle.js` - ESM bundle of the compiler
- `build/typespec-compiler.wasm` - WebAssembly component

## Usage

### From Rust (using wasmtime)

```rust
// Example using wasmtime component model (requires bindings generation)
use wasmtime::component::*;

// Load the component
let engine = Engine::default();
let component = Component::from_file(&engine, "typespec-compiler.wasm")?;

// ... instantiate and call compile-virtual or compile-root
```

### Testing with Node.js

```javascript
import { compileVirtual } from "@typespec/compiler-wasm";

const result = await compileVirtual(
  [
    {
      path: "/main.tsp",
      contents: "namespace MyService { op test(): void; }",
    },
    // NOTE: You must also provide the TypeSpec standard library files (at minimum `/lib/intrinsics.tsp`).
    // For now, this package does not bundle stdlib sources.
  ],
  "/main.tsp",
  {
    emitters: ["@typespec/openapi3"],
    outputDir: "/output",
    arguments: [],
  },
);

console.log(result.success);
console.log(result.diagnostics);
```

## Limitations

### Current Implementation

- **In-Memory Only**: `compile-virtual` is the only fully implemented function
- **No Standard Library Bundling**: Standard library files need to be included in the virtual filesystem
- **Emitter Support**: Limited to emitters that don't require Node.js-specific APIs
- **Output Collection**: Emitted files must fit in memory
- **No Caching**: No stdlib IR caching across invocations

### Not Supported

- Language Server Protocol (LSP) features
- Incremental compilation
- Multi-threaded compilation
- Streaming diagnostics or outputs

## Contracts

### Input

- **Files**: In-memory file set OR root path + entry file
- **Emitters**: List of emitter package names
- **Arguments**: Additional compiler configuration
- **Output Directory**: Where emitted files should be written

### Output

- **Success**: Boolean indicating compilation success (no errors)
- **Diagnostics**: All warnings and errors (never throws for normal compile errors)
- **Emitted Files**: Generated artifacts with full contents

### Error Handling

- Compilation errors are returned as diagnostics with `success: false`
- Only internal invariant violations will trap/panic
- All paths use POSIX separators (`/`)

## Development

### Running Tests

```bash
pnpm test
```

### Bundle Analysis

The build process includes bundle analysis. Check for:

- No Node.js built-ins in the bundle (except via CompilerHost)
- Reasonable bundle size
- Proper tree-shaking

```bash
# Audit for Node built-ins
grep -r "require.*['\"]fs['\"]" dist/bundle.js
grep -r "from.*['\"]fs['\"]" dist/bundle.js
```

## Future Enhancements

See the main issue for planned features:

- WASI-backed `compile-root` implementation
- Filesystem-only emission (return paths instead of contents)
- Streaming APIs for large outputs
- Standard library snapshot bundling
- Cached IR across invocations
- Additional WIT exports (format, lint, etc.)

## Contributing

This package is part of the TypeSpec monorepo. See the [main contributing guide](../../CONTRIBUTING.md).

## License

MIT - See [LICENSE](../../LICENSE)
