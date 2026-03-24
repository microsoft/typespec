---
slug: release-notes/typespec-1-10-0
title: "1.10.0"
releaseDate: 2026-03-10
version: "1.10.0"
---

# 1.10.0

## Features

### @typespec/compiler

- [#9060](https://github.com/microsoft/typespec/pull/9060) Added support for Functions, a new type graph entity and language feature. Functions enable library authors to provide input-output style transforms that operate on types and values. See [the Functions Documentation](https://typespec.io/docs/language-basics/functions/) for more information about the use and implementation of functions.
- [#9762](https://github.com/microsoft/typespec/pull/9762) Added experimental support for `internal` modifiers on type declarations. Any type _except `namespace`_ can be declared `internal`. An `internal` symbol can only be accessed from within the same package where it was declared.
- [#9829](https://github.com/microsoft/typespec/pull/9829) `tsp info` now accepts an optional `<libName>` argument to display detailed information about a specific library or emitter, including all available options.
- [#9819](https://github.com/microsoft/typespec/pull/9819) Export `resolveCodeFix` function to allow resolving a `CodeFix` into `CodeFixEdit[]` without the LSP layer.

### @typespec/openapi

- [#9577](https://github.com/microsoft/typespec/pull/9577) Add support for OpenAPI 3.2 nested tags via `parent` field in `@tagMetadata` decorator

### @typespec/openapi3

- [#9577](https://github.com/microsoft/typespec/pull/9577) Add support for OpenAPI 3.2 nested tags via `parent` field in `@tagMetadata` decorator
- [#9890](https://github.com/microsoft/typespec/pull/9890) `file-type` can now receive an array to allow emitting both `json` and `yaml` output in the same run.
- [#9742](https://github.com/microsoft/typespec/pull/9742) importer - Support importing `readOnly` and `writeOnly` properties from OpenAPI.
  - `readOnly: true` is converted to `@visibility(Lifecycle.Read)`
  - `writeOnly: true` is converted to `@visibility(Lifecycle.Create)`
  - Both properties are mutually exclusive, a warning is emitted if both are present and both are ignored

## Bug Fixes

### @typespec/compiler

- [#9939](https://github.com/microsoft/typespec/pull/9939) Fix `@overload` interface validation failing when the enclosing namespace is versioned
- [#9641](https://github.com/microsoft/typespec/pull/9641) Don't report `non-literal-string-template` diagnostic when interpolating an invalid reference
- [#9803](https://github.com/microsoft/typespec/pull/9803) Support `TYPESPEC_NPM_REGISTRY` environment variable to configure the npm registry used by `tsp init` and `tsp install` when fetching package manifests and downloading packages.
- [#9804](https://github.com/microsoft/typespec/pull/9804) Fix crash when using custom scalar initializer in examples or default values. [API] Fix crash in `serializeValueAsJson` when a custom scalar initializer has no recognized constructor (e.g. `S.i()` with no args). Now returns `undefined` instead of crashing.
- [#9670](https://github.com/microsoft/typespec/pull/9670) Fixed an issue where referencing a member of a templated alias with defaultable parameters would fail to instantiate the alias, leaking template parameters.

### @typespec/http

- [#9935](https://github.com/microsoft/typespec/pull/9935) Do not join routes starting with `?` or `:` with `/` (e.g. `@route("?pet=cat")` would result in `/?pet=cat`)
- [#9887](https://github.com/microsoft/typespec/pull/9887) Remove `patch-implicit-optional` warning.

### @typespec/openapi

- [#9686](https://github.com/microsoft/typespec/pull/9686) [API] Expose `setOperationId`

### @typespec/openapi3

- [#9634](https://github.com/microsoft/typespec/pull/9634) importer - Fix OpenAPI3 import to support JSON Schema 2020-12 sibling keywords alongside `$ref` (default, constraints, deprecated, etc.)
- [#9802](https://github.com/microsoft/typespec/pull/9802) Fix `tsp-openapi3` ignoring array constraints (`minItems`, `maxItems`) on nullable arrays defined with `anyOf` + `null`

### @typespec/versioning

- [#9932](https://github.com/microsoft/typespec/pull/9932) [API] Fix running multiple versioning mutators together

### @typespec/html-program-viewer

- [#9617](https://github.com/microsoft/typespec/pull/9617) Fix type graph viewer to display Symbol-keyed decorator state
