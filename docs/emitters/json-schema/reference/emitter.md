---
title: "Emitter usage"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Emitter

## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/json-schema
```

2. Via the config

```yaml
emit:
  - "@typespec/json-schema"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/json-schema"
options:
  "@typespec/json-schema":
    option: value
```

## Emitter options

### `file-type`

**Type:** `"yaml" | "json"`

Serialize the schema as either yaml or json.

### `int64-strategy`

**Type:** `"string" | "number"`

How to handle 64 bit integers on the wire. Options are:

- string: serialize as a string (widely interoperable)
- number: serialize as a number (not widely interoperable)

### `bundleId`

**Type:** `string`

When provided, bundle all the schemas into a single json schema document with schemas under $defs. The provided id is the id of the root document and is also used for the file name.

### `emitAllModels`

**Type:** `boolean`

When true, emit all model declarations to JSON Schema without requiring the @jsonSchema decorator.

### `emitAllRefs`

**Type:** `boolean`

When true, emit all references as json schema files, even if the referenced type does not have the `@jsonSchema` decorator or is not within a namespace with the `@jsonSchema` decorator.
