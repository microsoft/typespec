---
slug: release-notes/typespec-1-11-0
title: "1.11.0"
releaseDate: 2026-04-07
version: "1.11.0"
---

# 1.11.0

## Features

### @typespec/compiler

- [#9893](https://github.com/microsoft/typespec/pull/9893) Added a new template `FilterVisibility` to support more accurate visibility transforms. This replaces the `@withVisibilityFilter` decorator, which is now deprecated and slated for removal in a future version of TypeSpec.

## Bug Fixes

### @typespec/compiler

- [#10196](https://github.com/microsoft/typespec/pull/10196) Include model name in `duplicate-property` error message
- [#10199](https://github.com/microsoft/typespec/pull/10199) `duplicateDefaultVariant` diagnostic now includes the union type name
- [#10183](https://github.com/microsoft/typespec/pull/10183) Do not interpolate non primitive values in config automatically.
  ```yaml
  file-type: ["json", "yaml"]
  output-file: "openapi.{file-type}"
  ```
  Will not be interpolated as `openapi.json,yaml` but keep the placeholder `{file-type}` intact for the emitter to handle.
- [#9893](https://github.com/microsoft/typespec/pull/9893) Fixed a bug that would prevent template parameters from assigning to values in some cases.

### @typespec/openapi3

- [#10041](https://github.com/microsoft/typespec/pull/10041) [importer] Fix `anyOf` with `$ref` and inline object being incorrectly imported as a model instead of a union.
- [#10046](https://github.com/microsoft/typespec/pull/10046) Fix OpenAPI emitter failing with "Duplicate type name" error when using a named union with a `bytes` variant in a multipart body (e.g. `HttpPart<MyUnion>` where `MyUnion` includes `bytes`).
