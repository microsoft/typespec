---
title: "1.9.0"
releaseDate: 2026-02-10
version: "1.9.0"
---

# 1.9.0

## Deprecations

### @typespec/compiler

- [#9336](https://github.com/microsoft/typespec/pull/9336) Deprecate `program` parameter in `isArrayModelType` and `isRecordModelType` functions. Use the new single-argument overload instead: `isArrayModelType(type)` and `isRecordModelType(type)`.

## Features

### @typespec/compiler

- [#9078](https://github.com/microsoft/typespec/pull/9078) Remove type constraints from `@continuationToken` decorator
- [#9512](https://github.com/microsoft/typespec/pull/9512) [API] Add performance reporting utilities for emitters [See docs for more info](https://typespec.io/docs/extending-typespec/performance-reporting/)
- [#9475](https://github.com/microsoft/typespec/pull/9475) [API] `serializeValueAsJson` throws a `UnsupportedScalarConstructorError` for unsupported scalar constructor instead of crashing

### @typespec/openapi3

- [#9629](https://github.com/microsoft/typespec/pull/9629) importer - Add support for importing the `@continuationToken` decorator based on x-ms-list-continuation-token extension
- [#9627](https://github.com/microsoft/typespec/pull/9627) importer - Add support for importing paging link decorators (`@prevLink`, `@nextLink`, `@firstLink`, `@lastLink`) based on x-ms-list-\*-link OpenAPI extensions
- [#9609](https://github.com/microsoft/typespec/pull/9609) importer - Add support for x-ms-list extension to add `@list` decorator to operations
- [#9613](https://github.com/microsoft/typespec/pull/9613) importer - Add support for `@offset` decorator when x-ms-list-offset extension is present
- [#9618](https://github.com/microsoft/typespec/pull/9618) importer - Add support for `@pageSize` decorator based on x-ms-list-page-size extension
- [#9615](https://github.com/microsoft/typespec/pull/9615) importer - Add support for x-ms-list-page-items extension to `@pageItems` decorator
- [#9611](https://github.com/microsoft/typespec/pull/9611) importer - Add support for x-ms-list-page-index extension to add `@pageIndex` decorator
- [#9512](https://github.com/microsoft/typespec/pull/9512) Expose performance information when running with `--stats`
- [#9412](https://github.com/microsoft/typespec/pull/9412) importer - OpenAPI number type with duration format now converts to TypeSpec duration type with @encode("seconds", float32) decorator
- [#9584](https://github.com/microsoft/typespec/pull/9584) Expose `openapi-versions` emitter option now that both 3.1.0 and 3.2.0 are implemented.

## Bug Fixes

### @typespec/compiler

- [#9320](https://github.com/microsoft/typespec/pull/9320) Fix `--list-files` not working when multiple instance of compiler are loaded
- [#9607](https://github.com/microsoft/typespec/pull/9607) Fix stack overflow for specs with large number of circular references
- [#9342](https://github.com/microsoft/typespec/pull/9342) Ensuring ignore-deprecated gets resolved.
- [#9588](https://github.com/microsoft/typespec/pull/9588) Fixed several checking errors around template instantiations that could cause TemplateParameter instances to leak into decorator calls.

### @typespec/openapi3

- [#9410](https://github.com/microsoft/typespec/pull/9410) importer - null reference exception if member schema cannot be resolved
- [#9533](https://github.com/microsoft/typespec/pull/9533) Fix parameters with default value resulting in `$ref` with `default` as sibling for OpenAPI 3.0
- [#9583](https://github.com/microsoft/typespec/pull/9583) Fix: tag metadata not scopped to the service it was defined on
- [#9475](https://github.com/microsoft/typespec/pull/9475) Handle use of `.now()` constructor on date time types in examples and default.

### @typespec/json-schema

- [#9580](https://github.com/microsoft/typespec/pull/9580) Fix crash on usage of templates that cannot be named

### @typespec/versioning

- [#9444](https://github.com/microsoft/typespec/pull/9444) Fix incorrect incompatible versioning error in model expressions

### @typespec/rest

- [#8609](https://github.com/microsoft/typespec/pull/8609) Fix `@actionSeparator` decorator to only accept Operation, Interface, and Namespace targets
