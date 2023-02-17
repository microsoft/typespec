# TypeSpec OpenAPI 3.0 Emitter

This package provides the [TypeSpec](https://github.com/microsoft/typespec) emitter to produce OpenAPI 3.0 output from TypeSpec source.

## Install

In your typespec project root

```bash
npm install @typespec/openapi3
```

## Emit OpenAPI 3.0 spec

1. Via the command line

```bash
tsp compile . --emit @typespec/openapi3
```

2. Via the config

Add the following to the `tspconfig.yaml` file.

```yaml
emitters:
  @typespec/openapi3: true
```

For configuration [see options](#emitter-options)

## Use OpenAPI 3.0 specific decorators:

```typespec
import "@typespec/openapi3";

using OpenAPI;

// Using `using`
@useRef("common.json#/components/schemas/Foo")
model Foo {}

// Using fully qualified names
@OpenAPI.oneOf
union MyUnion {
  cat: Cat,
  dog: Dog,
}
```

## Decorators

- [@useRef](#useref)
- [@oneOf](#oneof)

### @useRef

Syntax:

```
@useRef(urlString)
```

`@useRef`

`@useRef` is used to replace the TypeSpec model type in emitter output with a pre-existing named OpenAPI schema.

### @oneOf

Syntax:

```
@oneOf()
```

`@oneOf`emits `oneOf` keyword for a union type in the resulting OpenAPI 3.0 specification. It indicates that the value of union type can only contain exactly one of the subschemas.

`@oneOf` can only be applied to a union types.

## Emitter options:

Emitter options can be configured via the `tspconfig.yaml` configuration:

```yaml
emitters:
  '@typespec/openapi3':
    <optionName>: <value>


# For example
emitters:
  '@typespec/openapi3':
    outputFile: my-custom-openapi.json
```

or via the command line with

```bash
--option "@typespec/openapi3.<optionName>=<value>"

# For example
--option "@typespec/openapi3.output-file=my-custom-openapi.json"
```

### `output-file`

Configure the name of the swagger output file relative to the compiler `output-path`.

### `new-line`

Set the newline character for emitting files. Can be either:

- `lf`(Default)
- `crlf`

### `omit-unreachable-types`

Only include types referenced via an operation.

## See also

- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec Website](https://microsoft.github.io/typespec)
- [TypeSpec for the OpenAPI Developer](https://github.com/microsoft/typespec/blob/main/docs/typespec-for-openapi-dev.md)
