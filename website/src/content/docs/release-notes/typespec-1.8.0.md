---
title: "1.8.0"
releaseDate: 2026-01-13
version: "1.8.0"
---

# 1.8.0

## Features

### @typespec/compiler

- [#9295](https://github.com/microsoft/typespec/pull/9295) Add `now()` initializer to date/time scalars (`plainDate`, `plainTime`, `utcDateTime`, `offsetDateTime`) for indicating current date/time at runtime. Emitters should interpret this as the appropriate runtime value (e.g., database `CURRENT_TIMESTAMP`, JavaScript `Date.now()`, etc.).
- [#9104](https://github.com/microsoft/typespec/pull/9104) [API] Introduction of decorator validator callbacks. A decorator can define some callbacks to achieve some deferred validation (After the type is finished or the whole graph is)
- [#9288](https://github.com/microsoft/typespec/pull/9288) [api] Expose `createSuppressCodeFixes` method to generate multiple code fixes from diagnostics
- [#9262](https://github.com/microsoft/typespec/pull/9262) Add support for OpenAPI 3.2.0 `defaultMapping` in discriminated unions. When a discriminated union has a default variant (unnamed variant), it is now properly emitted:
  - For OpenAPI 3.2.0: The default variant is included in `oneOf` array and referenced via `discriminator.defaultMapping` property
  - For OpenAPI 3.0 and 3.1: The default variant is included in `oneOf` array and its discriminator value is added to the `discriminator.mapping` object
- [#9300](https://github.com/microsoft/typespec/pull/9300) Add typekit to tester instances and test compile result"

### @typespec/openapi3

- [#9289](https://github.com/microsoft/typespec/pull/9289) Add support for importing deprecated properties and types from OpenAPI
- [#9262](https://github.com/microsoft/typespec/pull/9262) Add support for OpenAPI 3.2.0 `defaultMapping` in discriminated unions. When a discriminated union has a default variant (unnamed variant), it is now properly emitted:
  - For OpenAPI 3.2.0: The default variant is included in `oneOf` array and referenced via `discriminator.defaultMapping` property
  - For OpenAPI 3.0 and 3.1: The default variant is included in `oneOf` array and its discriminator value is added to the `discriminator.mapping` object

## Bug Fixes

### @typespec/compiler

- [#9280](https://github.com/microsoft/typespec/pull/9280) suppress - a extends/is inner statement suppress should be generated on the parent model node
- [#9293](https://github.com/microsoft/typespec/pull/9293) compiler - suppression node selection for operation response bodies
- [#9308](https://github.com/microsoft/typespec/pull/9308) Fixed mutation of decorator's argument values

### @typespec/http

- [#9311](https://github.com/microsoft/typespec/pull/9311) Fix empty response models with `statusCode` defined in a base model

### @typespec/openapi3

- [#9228](https://github.com/microsoft/typespec/pull/9228) Importer: Escape ${...} patterns in extension string property values to prevent interpolation
- [#9236](https://github.com/microsoft/typespec/pull/9236) Fix extension properties with JSON-like strings using escaped string literals to prevent triple-quote syntax issues
- [#9275](https://github.com/microsoft/typespec/pull/9275) import tool - avoid double escaping backslashes
- [#9265](https://github.com/microsoft/typespec/pull/9265) import tool - missing imports for SSE events
- [#9265](https://github.com/microsoft/typespec/pull/9265) import tool - escape SSE event union identifiers when required
