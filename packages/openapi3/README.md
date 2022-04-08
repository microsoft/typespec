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

## See also

- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl Tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
- [Cadl for the OpenAPI Developer](https://github.com/microsoft/cadl/blob/main/docs/cadl-for-openapi-dev.md)
