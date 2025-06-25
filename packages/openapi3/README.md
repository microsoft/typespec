# @typespec/openapi3

TypeSpec library for emitting OpenAPI 3.0 and OpenAPI 3.1 from the TypeSpec REST protocol binding and converting OpenAPI3 to TypeSpec

## Install

```bash
npm install @typespec/openapi3
```

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/openapi3
```

2. Via the config

```yaml
emit:
  - "@typespec/openapi3"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/openapi3`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `file-type`

**Type:** `"yaml" | "json"`

If the content should be serialized as YAML or JSON. Default 'yaml', it not specified infer from the `output-file` extension

### `output-file`

**Type:** `string`

Name of the output file.
Output file will interpolate the following values:

- service-name: Name of the service
- service-name-if-multiple: Name of the service if multiple
- version: Version of the service if multiple

Default: `{service-name-if-multiple}.{version}.openapi.yaml` or `.json` if `file-type` is `"json"`

Example Single service no versioning

- `openapi.yaml`

Example Multiple services no versioning

- `openapi.Org1.Service1.yaml`
- `openapi.Org1.Service2.yaml`

Example Single service with versioning

- `openapi.v1.yaml`
- `openapi.v2.yaml`

Example Multiple service with versioning

- `openapi.Org1.Service1.v1.yaml`
- `openapi.Org1.Service1.v2.yaml`
- `openapi.Org1.Service2.v1.0.yaml`
- `openapi.Org1.Service2.v1.1.yaml`

### `openapi-versions`

**Type:** `array`

### `new-line`

**Type:** `"crlf" | "lf"`

Set the newline character for emitting files.

### `omit-unreachable-types`

**Type:** `boolean`

Omit unreachable types.
By default all types declared under the service namespace will be included. With this flag on only types references in an operation will be emitted.

### `include-x-typespec-name`

**Type:** `"inline-only" | "never"`

If the generated openapi types should have the `x-typespec-name` extension set with the name of the TypeSpec type that created it.
This extension is meant for debugging and should not be depended on.

### `safeint-strategy`

**Type:** `"double-int" | "int64"`

How to handle safeint type. Options are:

- `double-int`: Will produce `type: integer, format: double-int`
- `int64`: Will produce `type: integer, format: int64`

Default: `int64`

### `seal-object-schemas`

**Type:** `boolean`

If true, then for models emitted as object schemas we default `additionalProperties` to false for
OpenAPI 3.0, and `unevaluatedProperties` to false for OpenAPI 3.1, if not explicitly specified elsewhere.
Default: `false`

### `experimental-parameter-examples`

**Type:** `"data" | "serialized"`

Determines how to emit examples on parameters.
Note: This is an experimental feature and may change in future versions.
See https://spec.openapis.org/oas/v3.0.4.html#style-examples for parameter example serialization rules
See https://github.com/OAI/OpenAPI-Specification/discussions/4622 for discussion on handling parameter examples.

## Decorators

### TypeSpec.OpenAPI

- [`@oneOf`](#@oneof)
- [`@useRef`](#@useref)

#### `@oneOf`

Specify that `oneOf` should be used instead of `anyOf` for that union.

```typespec
@TypeSpec.OpenAPI.oneOf
```

##### Target

`Union | ModelProperty`

##### Parameters

None

#### `@useRef`

Specify an external reference that should be used inside of emitting this type.

```typespec
@TypeSpec.OpenAPI.useRef(ref: valueof string)
```

##### Target

`Model | ModelProperty`

##### Parameters

| Name | Type             | Description                                                          |
| ---- | ---------------- | -------------------------------------------------------------------- |
| ref  | `valueof string` | External reference(e.g. "../../common.json#/components/schemas/Foo") |
