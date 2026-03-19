---
title: "1.1.0"
releaseDate: 2025-06-10
version: "1.1.0"
---

## Features

### @typespec/compiler

- [#7377](https://github.com/microsoft/typespec/pull/7377) Add a `--stats` flag to `tsp compile` to log some performance and complexity statistics
- [#7530](https://github.com/microsoft/typespec/pull/7530) Show the full definition of model and interface when it has 'extends' and 'is' relationship in the hover text
- [#6923](https://github.com/microsoft/typespec/pull/6923) Init templates can define a project kind which decide if dependencies are added to peer or regular dependencies
- [#6783](https://github.com/microsoft/typespec/pull/6783) Install packages for unrecognized import via npm command
- [#7239](https://github.com/microsoft/typespec/pull/7239) [LSP] Expose new compile project command
- [#7137](https://github.com/microsoft/typespec/pull/7137) Allow passing template parameters as property defaults
- [#7256](https://github.com/microsoft/typespec/pull/7256) Expose `VisibilityFilter.toCacheKey` to allow caching results based on visibility filters.

### @typespec/openapi3

- [#7219](https://github.com/microsoft/typespec/pull/7219) [OpenAPI -> tsp] Add support for converting inline schemas using allOf
- [#7403](https://github.com/microsoft/typespec/pull/7403) Adds support for parameter examples via `@opExample` via the `experimental-parameter-examples` option.

### typespec-vscode

- [#7317](https://github.com/microsoft/typespec/pull/7317) Enable emit code command on tspconfig.yaml.
- [#6783](https://github.com/microsoft/typespec/pull/6783) Install packages for unrecognized import via npm command
- [#7239](https://github.com/microsoft/typespec/pull/7239) Use language server to compile project instead of CLI
- [#7331](https://github.com/microsoft/typespec/pull/7331) Support prompting to install compiler proactively if no compiler is found when starting LSP
- [#7541](https://github.com/microsoft/typespec/pull/7541) Add extension API for other vscode extension to be able to register more TypeSpec InitTemplate to choose when scaffolding TypeSpec project.

## Bug Fixes

### @typespec/compiler

- [#7421](https://github.com/microsoft/typespec/pull/7421) Fix hanging when using `::returnType` meta accessor on operation defined with `op is`
- [#7507](https://github.com/microsoft/typespec/pull/7507) Fix empty string emitting error when used in string interpolation in a template
- [#7524](https://github.com/microsoft/typespec/pull/7524) Fixes an error where reported diagnostics had invalid relative paths on Windows
- [#7508](https://github.com/microsoft/typespec/pull/7508) Allow extends of array expression for not just template (`model MyStrings extends string[]`)
- [#7473](https://github.com/microsoft/typespec/pull/7473) Mutator were not mutating tuple values
- [#7485](https://github.com/microsoft/typespec/pull/7485) Fix paging operations to correctly detect the `@pageItems` decorator on base models.
- [#7461](https://github.com/microsoft/typespec/pull/7461) Remove non documented `templateArguments` property on types
- [#7480](https://github.com/microsoft/typespec/pull/7480) Fix infinite recursion when navigating paging properties by detecting and handling circular model references.
- [#7137](https://github.com/microsoft/typespec/pull/7137) Allow passing tempalate parameter values in object and array values used inside the template
- [#7295](https://github.com/microsoft/typespec/pull/7295) Corrected visibility filtering logic to even more aggressively deduplicate the models it visits when the applied visibility transform does not actually remove any properties from a model.

### @typespec/openapi

- [#7509](https://github.com/microsoft/typespec/pull/7509) Fix `@tagMetadata` decorator emitting error when incorrectly not finding `@service` decorator

### @typespec/json-schema

- [#7501](https://github.com/microsoft/typespec/pull/7501) Json schema emitter conflict with other emitters

### typespec-vscode

- [#7300](https://github.com/microsoft/typespec/pull/7300) Unify the writing of OpenAPI 3
- [#7353](https://github.com/microsoft/typespec/pull/7353) Fix openapi3 preview error when path contains space
- [#7374](https://github.com/microsoft/typespec/pull/7374) Check whether the compiler language server supports project compilation.
- [#7302](https://github.com/microsoft/typespec/pull/7302) Telemetry data item result displays `cancelled` when the `Select file` step of `Preview API Documentation` is `cancelled`

### @typespec/versioning

- [#7473](https://github.com/microsoft/typespec/pull/7473) Fix tuples not correctly versioned
