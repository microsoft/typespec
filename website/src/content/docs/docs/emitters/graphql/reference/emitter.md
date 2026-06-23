---
title: "Emitter usage"
---

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/graphql
```

2. Via the config

```yaml
emit:
  - "@typespec/graphql"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/graphql"
options:
  "@typespec/graphql":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/graphql`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `output-file`

**Type:** `string`

Name of the output file.
Output file will interpolate the following values:

- schema-name: Name of the schema if multiple

Default: `{schema-name}.graphql`

Example Single schema

- `schema.graphql`

Example Multiple schemas

- `Org1.Schema1.graphql`
- `Org1.Schema2.graphql`

### `new-line`

**Type:** `"crlf" | "lf"`

Set the newLine character for emitting files.

### `omit-unreachable-types`

**Type:** `boolean`

Omit unreachable types.
By default all types declared under the schema namespace will be included.
With this flag on only types references in an operation will be emitted.
