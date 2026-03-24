---
title: "1.3.0"
releaseDate: 2025-08-06
version: "1.3.0"
---

# 1.3.0

## Features

### @typespec/compiler

- [#7830](https://github.com/microsoft/typespec/pull/7830) [API] `resolveCompilerOptions` now only takes a `SystemHost` instead of `CompilerHost`
- [#7912](https://github.com/microsoft/typespec/pull/7912) Updates the `tsp init` command to support passing in more options via CLI flags. The `-y` option can also be used to auto accept prompts.

### typespec-vscode

- [#7830](https://github.com/microsoft/typespec/pull/7830) Get emitter options from the `resolveCompilerOptions` function of the compiler

### @typespec/versioning

- [#7999](https://github.com/microsoft/typespec/pull/7999) Use of `@useDependency` is now optional when referencing types from a versioned library. By default the latest version of the library will be used.

### @typespec/html-program-viewer

- [#8013](https://github.com/microsoft/typespec/pull/8013) Add button to bookmark types in the type graph into `window.vars`

## Bug Fixes

### @typespec/compiler

- [#7721](https://github.com/microsoft/typespec/pull/7721) Make the `console.*` methods usable in the compiler and display them in the vscode output.
- [#8012](https://github.com/microsoft/typespec/pull/8012) Fix `tsp format --check` incorrectly validating needs format
- [#7957](https://github.com/microsoft/typespec/pull/7957) Fix incorrectly reported `incompatible-compiler-version` in some cases when using symlinks
- [#7947](https://github.com/microsoft/typespec/pull/7947) [API] [Testing] Ignore test files in legacy library definition
- [#7899](https://github.com/microsoft/typespec/pull/7899) Ensure models that are spread, intersected or used as the base are fully checked before trying to copy the properties
- [#8002](https://github.com/microsoft/typespec/pull/8002) Union expressions are correctly attached to the namespace they were declared in

### @typespec/html-program-viewer

- [#7899](https://github.com/microsoft/typespec/pull/7899) Handle new `creating` property
