---
title: "1.6.0"
releaseDate: 2025-11-11
version: "1.6.0"
---

# 1.6.0

## Features

### @typespec/compiler

- [#8868](https://github.com/microsoft/typespec/pull/8868) [API] Add new `createAddDecoratorCodeFix` function to help generating a codefix to add a decorator to a target node.
- [#8580](https://github.com/microsoft/typespec/pull/8580) Add support for `@minValue`, `@maxValue` and their exclusive variant for datetime and duration types.
  Expose as well the following APIs
  - `getMinValueForScalar`
  - `getMaxValueForScalar`
  - `getMinValueExclusiveForScalar`
  - `getMaxValueExclusiveForScalar`
- [#8938](https://github.com/microsoft/typespec/pull/8938) [API] Add `repository` field to `PackageJson` type

### @typespec/openapi3

- [#8888](https://github.com/microsoft/typespec/pull/8888) Add support for emission and import of SSE for OpenAPI 3.2
- [#8828](https://github.com/microsoft/typespec/pull/8828) Add support for OpenAPI 3.2.0 emission
- [#8830](https://github.com/microsoft/typespec/pull/8830) [converter] Generate separate operations with @sharedRoute for operations with multiple incompatible content types (e.g., multipart/form-data and application/json)
- [#8727](https://github.com/microsoft/typespec/pull/8727) [converter] Generated doc comments render on a single line unless doc has new lines
- [#8580](https://github.com/microsoft/typespec/pull/8580) Add support for min/max value for date time and duration types

## Bug Fixes

### @typespec/compiler

- [#8792](https://github.com/microsoft/typespec/pull/8792) Compiler internal decorators shouldn't be listed in autocomplete
- [#8733](https://github.com/microsoft/typespec/pull/8733) Fix namespace merge for namespaces with same name but different parent under a file namespace scope.
- [#8698](https://github.com/microsoft/typespec/pull/8698) [TM Grammar] Fix issue with directive used after decorators
- [#8751](https://github.com/microsoft/typespec/pull/8751) Correctly report error when trying to reference member of templates without using the arguments
- [#8780](https://github.com/microsoft/typespec/pull/8780) Fix missing examples in OpenAPI when response uses union of unions
- [#8676](https://github.com/microsoft/typespec/pull/8676) Correctly rename nested models when applying the `Update` visibility transform.
- [#8687](https://github.com/microsoft/typespec/pull/8687) Fix go to definition for directory imports
- [#8681](https://github.com/microsoft/typespec/pull/8681) Fix duplicate detection for `@encodedName` decorator applications.

### @typespec/http

- [#8974](https://github.com/microsoft/typespec/pull/8974) Do not report `no-service-found` if there is a service even if it has no routes
- [#8737](https://github.com/microsoft/typespec/pull/8737) Fix `@bodyIgnore` property shouldn't count as implicit body property for check

### @typespec/openapi3

- [#8945](https://github.com/microsoft/typespec/pull/8945) [importer] Add missing value checks before attempting conversion
- [#8773](https://github.com/microsoft/typespec/pull/8773) [importer] Fix support of type arrays with null
- [#8829](https://github.com/microsoft/typespec/pull/8829) Fix escaping of ${...} in string literals to prevent interpolation
- [#8871](https://github.com/microsoft/typespec/pull/8871) Import: Convert OpenAPI unixtime format to utcDateTime with @encode decorator
- [#8764](https://github.com/microsoft/typespec/pull/8764) [converter] Fix multi line docs for server variables producing invalid syntax
- [#8727](https://github.com/microsoft/typespec/pull/8727) [converter] Render `@server` with multi line doc correctly
- [#8711](https://github.com/microsoft/typespec/pull/8711) Fix duplicate names when `@discriminated` unions are used in the context of visibility transforms.

### @typespec/json-schema

- [#8739](https://github.com/microsoft/typespec/pull/8739) Correctly emit `union`, `enum`, `scalar` when marked with `@jsonSchema`

### typespec-vscode

- [#8735](https://github.com/microsoft/typespec/pull/8735) Fix `pnpm clean && pnpm build` create diff in vscode package folder
