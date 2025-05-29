---
title: "Emitter usage"
---

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/protobuf
```

2. Via the config

```yaml
emit:
  - "@typespec/protobuf"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/protobuf"
options:
  "@typespec/protobuf":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/protobuf`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `noEmit`

**Type:** `boolean`

If set to `true`, this emitter will not write any files. It will still validate the TypeSpec sources to ensure they are compatible with Protobuf, but the files will simply not be written to the output directory.

### `omit-unreachable-types`

**Type:** `boolean`

By default, the emitter will create `message` declarations for any models in a namespace decorated with `@package` that have an `@field` decorator on every property. If this option is set to true, this behavior will be disabled, and only messages that are explicitly decorated with `@message` or that are reachable from a service operation will be emitted.
