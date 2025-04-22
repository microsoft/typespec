---
title: "1.0.0-rc.1"
releaseDate: 2025-04-22
version: "1.0.0-rc.1"
---

## Features

### @typespec/compiler

- [#7067](https://github.com/microsoft/typespec/pull/7067) Adding support for nested paging properties.
- [#6862](https://github.com/microsoft/typespec/pull/6862) `--trace` cli option applies to all commands now
- [#7065](https://github.com/microsoft/typespec/pull/7065) Adds a TypeKit for Tuple types
- [#7049](https://github.com/microsoft/typespec/pull/7049) Adds a new createDiagnosable typekit helper for APIs that return diagnostics
- [#7047](https://github.com/microsoft/typespec/pull/7047) Adds typekit support for creating unions from enums

### @typespec/http

- [#7049](https://github.com/microsoft/typespec/pull/7049) Updates `$.httpOperation.get` to be a diagnosable - use `$.httpOperation.get.withDiagnostics` to get diagnostics
- [#6949](https://github.com/microsoft/typespec/pull/6949) Improved types for HTTP multipart payloads for more precise guarantees and additional information about the resolution of individual parts.

## Experimental features breaking changes

### @typespec/compiler

- [#7018](https://github.com/microsoft/typespec/pull/7018) Removes the default typekit in favor of always instantiating typekits with either a `program` or `realm`.

## Bug Fixes

### @typespec/compiler

- [#6897](https://github.com/microsoft/typespec/pull/6897) Improve errors when loading libraries with invalid exports/main fields
- [#7069](https://github.com/microsoft/typespec/pull/7069) Mark `node` property on all typespec types as optional
- [#7063](https://github.com/microsoft/typespec/pull/7063) Fixes an issue where isError was checking for error types instead of error models.
- [#7047](https://github.com/microsoft/typespec/pull/7047) Preserve API documentation when calling `$.enum.createFromUnion`

### @typespec/http

- [#6962](https://github.com/microsoft/typespec/pull/6962) Fixes issue where each variant of a `@discriminated` union was treated as a separate response instead of the whole union being treated as a single response.
- [#7069](https://github.com/microsoft/typespec/pull/7069) Handle types without node
- [#7065](https://github.com/microsoft/typespec/pull/7065) Handle tuples without nodes

### @typespec/openapi

- [#6947](https://github.com/microsoft/typespec/pull/6947) Fix crash when using enum values in extension

### @typespec/openapi3

- [#6279](https://github.com/microsoft/typespec/pull/6279) Fix various issues when using xml payloads and custom scalars
- [#6887](https://github.com/microsoft/typespec/pull/6887) Fix using union templates

### @typespec/json-schema

- [#6947](https://github.com/microsoft/typespec/pull/6947) Fix crash when using enum values in extension
- [#6887](https://github.com/microsoft/typespec/pull/6887) Fix using union templates

### typespec-vscode

- [#6894](https://github.com/microsoft/typespec/pull/6894) Fix the issue where the emitter version is undefined in telemetry.
- [#7021](https://github.com/microsoft/typespec/pull/7021) Fix crash when initialize telemetry client

### @typespec/versioning

- [#7022](https://github.com/microsoft/typespec/pull/7022) Fix issue where the incompatible-versioned-reference diagnostic was incorrectly triggered when a model had a `@removed` decorator and one of its properties had an `@added` decorator, even if the versions were compatible.

  Example:

  ```tsp
  @removed(Versions.v3)
  model Widget {
    @added(Versions.v2)
    name: string;
  }
  ```

### @typespec/protobuf

- [#7069](https://github.com/microsoft/typespec/pull/7069) Handle types without node

### @typespec/internal-build-utils

- [#6676](https://github.com/microsoft/typespec/pull/6676) Fix third party resolution getting duplicate entries
