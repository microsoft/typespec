---
title: "1.7.0"
releaseDate: 2025-12-09
version: "1.7.0"
---

# 1.7.0

## Features

### @typespec/compiler

- [#9002](https://github.com/microsoft/typespec/pull/9002) Add `commaDelimited` and `newlineDelimited` values to `ArrayEncoding` enum for serializing arrays with comma and newline delimiters
- [#8942](https://github.com/microsoft/typespec/pull/8942) - Add 'exit' final event for linter rules
  - Support 'async' in linter definition and async function as callback for 'exit' event.
- [#9024](https://github.com/microsoft/typespec/pull/9024) [API] Add `node` to `SourceModel` type
- [#8619](https://github.com/microsoft/typespec/pull/8619) Add support for escaping param like tags(`@param`, `@prop`, etc.) identifier with backtick in doc comments to allow special characters

### @typespec/http

- [#8962](https://github.com/microsoft/typespec/pull/8962) support documentation on union variants for response descriptions

### @typespec/openapi3

- [#9002](https://github.com/microsoft/typespec/pull/9002) Add `commaDelimited` and `newlineDelimited` values to `ArrayEncoding` enum for serializing arrays with comma and newline delimiters

### @typespec/json-schema

- [#9038](https://github.com/microsoft/typespec/pull/9038) Add discriminator support and polymorphic models strategy option
  - Automatically injects discriminator property into base models with `@discriminator` decorator
  - Marks discriminator property as required in generated schemas
  - New `polymorphic-models-strategy` emitter option with three strategies:
    - `ignore`: Emit as regular object schema (default)
    - `oneOf`: Emit oneOf schema for closed discriminated unions
    - `anyOf`: Emit anyOf schema for open discriminated unions
  - Includes discriminator.mapping in oneOf/anyOf schemas for improved validation

## Bug Fixes

### @typespec/compiler

- [#8917](https://github.com/microsoft/typespec/pull/8917) Add security warning to tsp init CLI documentation for external templates (#8916)
- [#8997](https://github.com/microsoft/typespec/pull/8997) UnusedUsing Diagnostics are reported as warning instead of hint when there are linters defined in tspconfig.yaml

### @typespec/http

- [#8961](https://github.com/microsoft/typespec/pull/8961) Support nested unions in operation return types

### @typespec/openapi3

- [#9151](https://github.com/microsoft/typespec/pull/9151) Import OpenAPI 3.1/3.2 schemas with contentEncoding: base64 as bytes type with `@encode("base64", string)` decorator
- [#9076](https://github.com/microsoft/typespec/pull/9076) Respect `@externalDocs` on properties
- [#8961](https://github.com/microsoft/typespec/pull/8961) Support nested unions in operation return types
