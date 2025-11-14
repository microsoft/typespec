---
title: "1.5.0"
releaseDate: 2025-10-08
version: "1.5.0"
---

# 1.5.0

## Features

### @typespec/compiler

- [#8549](https://github.com/microsoft/typespec/pull/8549) [Testing API] Expose marker position in Tester
- [#8491](https://github.com/microsoft/typespec/pull/8491) Add milliseconds to DurationKnownEncoding
- [#7929](https://github.com/microsoft/typespec/pull/7929) [LSP] Allow configuring which file names to use as entrypoints
- [#8525](https://github.com/microsoft/typespec/pull/8525) [API] Expose `applyCodeFix` and `createSuppressCodeFix`
- [#8652](https://github.com/microsoft/typespec/pull/8652) [API] Export `getNodeForTarget` in `@typespec/compiler/ast` exports
- [#8542](https://github.com/microsoft/typespec/pull/8542) [API] Expose `applyCodeFixEdits`, `resolveCodeFix`
- [#8544](https://github.com/microsoft/typespec/pull/8544) [api] adds the ability to pass the suppression message
- [#8632](https://github.com/microsoft/typespec/pull/8632) [API] Allow using union in emitter schemas
- [#8586](https://github.com/microsoft/typespec/pull/8586) Widen target types for the `@secret` decorator to include Model, Union, and Enum types, in addition to existing Scalar and ModelProperty targets. This allows marking any data type as secret for comprehensive data sensitivity handling.
- [#8055](https://github.com/microsoft/typespec/pull/8055) Show template parameters default in hover signature
- [#8234](https://github.com/microsoft/typespec/pull/8234) Support codefix on different file and creating file when needed
- [#8670](https://github.com/microsoft/typespec/pull/8670) [Tester] Support sub exports without having them being defined as separate libraries

### @typespec/openapi3

- [#8632](https://github.com/microsoft/typespec/pull/8632) Add a new `operation-id-strategy` option.
  - `parent-container` (default and previous behavior) Join operation name with its parent if applicable with an underscore
  - `fqn` Join the path from the service root to the operation with `.`
  - `none` Do not generate operation ids, only include explicit ones set with `@operationId`

### typespec-vscode

- [#7929](https://github.com/microsoft/typespec/pull/7929) Allow configuring which file names to use as entrypoints
- [#8346](https://github.com/microsoft/typespec/pull/8346) 1. Limit the vscode tasks to be created when the extension is starting 2. Do not include the emitters by default when compiling in LSP. Setting 'typespec.lsp.emit' can be used to configure the emitters to include explicitly (set to ['<config:defaults>'] to include all the emitters defined in tspconfig.yaml)

## Bug Fixes

### @typespec/compiler

- [#8506](https://github.com/microsoft/typespec/pull/8506) Fix issue when the 'entrypoint' setting is default to null
- [#8462](https://github.com/microsoft/typespec/pull/8462) Fix grammar error in TypeSpec unused-using warning message by removing incorrect word "be" from "never be used"
- [#8548](https://github.com/microsoft/typespec/pull/8548) Linter rule tester not passing parseDocs option to new tester instance
- [#8578](https://github.com/microsoft/typespec/pull/8578) Add suppression codefix looks up for the first valid parent
- [#8452](https://github.com/microsoft/typespec/pull/8452) [Tester] Fix issue that could cause some timeout
- [#8573](https://github.com/microsoft/typespec/pull/8573) LSP connection failure after dynamically loading a certain library in the package
- [#8670](https://github.com/microsoft/typespec/pull/8670) Allow importing of self (e.g. `@typespec/openapi/some/path` when in `@typespec/openapi`) respecting ESM spec.

### @typespec/openapi3

- [#8584](https://github.com/microsoft/typespec/pull/8584) [importer] fixes import of additional properties : true {} to result in Record<unknown>
- [#8621](https://github.com/microsoft/typespec/pull/8621) [importer] unwrap single any/oneOf to get semantically meaningful types
- [#8419](https://github.com/microsoft/typespec/pull/8419) adds enum prefix for defaults values of enums on import
- [#8434](https://github.com/microsoft/typespec/pull/8434) do not emit defaults for each member type when importing openapi descriptions
- [#8514](https://github.com/microsoft/typespec/pull/8514) [converter] anyOf/oneOf type + type:null gets imported properly and maintains decorators, documentation,...
- [#8623](https://github.com/microsoft/typespec/pull/8623) [importer] only import multipart request body when it's present
- [#8432](https://github.com/microsoft/typespec/pull/8432) fixes a regression where a null valued default would make the import crash
- [#8605](https://github.com/microsoft/typespec/pull/8605) Fix crash when using a property called `set`
- [#8632](https://github.com/microsoft/typespec/pull/8632) Deduplicate operation ids that would resolve to the same one

### @typespec/json-schema

- [#8605](https://github.com/microsoft/typespec/pull/8605) Fix crash when using a property called `set`

### @typespec/rest

- [#8644](https://github.com/microsoft/typespec/pull/8644) Fix crash when resource would recursively reference itself via `@parentResource`
