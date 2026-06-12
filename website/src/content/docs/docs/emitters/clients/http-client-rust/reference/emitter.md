---
title: "Emitter usage"
---

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@azure-tools/typespec-rust
```

2. Via the config

```yaml
emit:
  - "@azure-tools/typespec-rust"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@azure-tools/typespec-rust"
options:
  "@azure-tools/typespec-rust":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@azure-tools/typespec-rust`.
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `crate-name`

**Type:** `string`

**Required**

The name of the generated Rust crate as it appears in `Cargo.toml`.

### `crate-version`

**Type:** `string`

**Required**

The version string of the generated Rust crate as it appears in `Cargo.toml` (e.g. `"0.1.0"`).

### `omit-constructors`

**Type:** `boolean`

Set to `true` to skip generating constructors and their associated options type for all client structs. Useful when constructors are hand-written in a `client.tsp` customization layer. The default value is `false`.

### `overwrite-cargo-toml`

**Type:** `boolean`

Set to `true` to overwrite an existing `Cargo.toml` file in the output directory. By default the emitter skips re-generating `Cargo.toml` when one already exists, so that hand-edited dependency entries are preserved. The default value is `false`.

### `overwrite-lib-rs`

**Type:** `boolean`

Set to `true` to overwrite an existing `lib.rs` file in the output directory. By default the emitter skips re-generating `lib.rs` so that hand-written module declarations are preserved. The default value is `false`.

### `emit-error-traits`

**Type:** `boolean`

Set to `true` to emit `TryFrom` trait implementations for terminal error types. This allows callers to convert a generic `azure_core::Error` into a strongly-typed error model. The default value is `false`.

### `temp-omit-doc-links`

**Type:** `boolean`

Set to `true` to omit intra-doc links in the generated Rust documentation comments. This is a temporary workaround for cases where the generated link targets are not yet resolvable by `rustdoc`. The default value is `false`.
