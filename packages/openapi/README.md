# Cadl OpenAPI Library

This package provide [Cadl](https://github.com/microsoft/cadl) decorators to specify some OpenAPI specific concepts.

## Install

In your cadl project root

```bash
npm install @cadl-lang/openapi
```

## Use OpenAPI specific decorators:

```cadl
import "@cadl-lang/openapi";

using OpenAPI;

// Using `using`
@extension("x-custom", "MyCustomValue")
model Foo {}

// Using fully qualified names
@OpenAPI.operationId("custom_Foo")
op foo(): string;

```

## See also

- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl Tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
- [Cadl for the OpenAPI Developer](https://github.com/microsoft/cadl/blob/main/docs/cadl-for-openapi-dev.md)
