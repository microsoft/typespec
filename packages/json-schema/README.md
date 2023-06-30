# TypeSpec JSON Schema Emitter

This package provides [TypeSpec](https://github.com/microsoft/TypeSpec) support for emitting JSON Schema version `2020-12` from TypeSpec definitions. It also provides [decorators for adding JSON Schema constraints](https://microsoft.github.io/typespec/standard-library/json-schema/reference/decorators). The emitter supports either YAML or JSON output and can be configured to emit one file per schema or bundle all schemas in to a single file.

## Installation

```bash
npm install @typespec/json-schema
```

## Usage

Add the `@jsonSchema` decorator to any types or namespaces you want to emit as JSON Schema.

```TypeSpec
import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema
namespace Example;

model Car {
  make: string;
  model: string;
}
```

To emit JSON Schema, use either of the following:

1. Via the command line

```bash
tsp compile . --emit @typespec/json-schema
```

2. Via the config

Add the following to the `tspconfig.yaml` file.

```yaml
emitters:
  @typespec/json-schema: true
```

For more information, consult the [JSON Schema documentation](https://microsoft.github.io/typespec/standard-library/json-schema/reference).

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

## See also

- [Json Schema Emitter Documentation](https://microsoft.github.io/typespec/standard-library/json-schema/reference)
- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec Website](https://microsoft.github.io/typespec)
