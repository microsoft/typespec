# Cadl OpenAPI 3.0 Emitter

This package provides the [Cadl](https://github.com/microsoft/cadl) emitter to produce OpenAPI 3.0 output from Cadl source.

## Install

In your cadl project root

```bash
npm install @cadl-lang/openapi3
```

## Emit OpenAPI 3.0 spec

1. Via the command line

```bash
cadl compile . --emit @cadl-lang/openapi3
```

2. Via the config

Add the following to the `cadl-project.yaml` file.

```yaml
emitters:
  @cadl-lang/openapi3: true
```

For configuration [see options](#emitter-options)

## Use OpenAPI 3.0 specific decorators:

```cadl
import "@cadl-lang/openapi3";

using OpenAPI.V3;

// Using `using`
@useRef("common.json#/components/schemas/Foo")
model Foo {}

// Using fully qualified names
@OpenAPI.V3.oneOf
union MyUnion {
  cat: Cat,
  dog: Dog,
}

```

## Emitter options:

Emitter options can be configured via the `cadl-project.yaml` configuration:

```yaml
emitters:
  '@cadl-lang/openapi3':
    <optionName>: <value>


# For example
emitters:
  '@cadl-lang/openapi3':
    outputFile: my-custom-openapi.json
```

or via the command line with

```bash
--option "@cadl-lang/openapi3.<optionName>=<value>"

# For example
--option "@cadl-lang/openapi3.output-file=my-custom-openapi.json"
```

### `output-file`

Configure the name of the swagger output file relative to the compiler `output-path`.

### `new-line`

Set the newline character for emitting files. Can be either:

- `lf`(Default)
- `crlf`

## See also

- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl Tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
- [Cadl for the OpenAPI Developer](https://github.com/microsoft/cadl/blob/main/docs/cadl-for-openapi-dev.md)
