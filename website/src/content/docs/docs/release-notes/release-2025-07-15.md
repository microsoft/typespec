---
title: "1.2.0"
releaseDate: 2025-07-15
version: "1.2.0"
---

# 1.2.0

## Features

### @typespec/compiler

- [#7576](https://github.com/microsoft/typespec/pull/7576) Allow LSP to configure which emitters to include for live checks
- [#7151](https://github.com/microsoft/typespec/pull/7151) [API] Addition of a new testing framework. See https://typespec.io/docs/extending-typespec/testing

### typespec-vscode

- [#7576](https://github.com/microsoft/typespec/pull/7576) Allow LSP to configure which emitters to include for live checks

### @typespec/html-program-viewer

- [#7620](https://github.com/microsoft/typespec/pull/7620) Render `indexer` property on model
- [#7836](https://github.com/microsoft/typespec/pull/7836) Expose program viewer navigation in TypGraph props

## Bug Fixes

### @typespec/compiler

- [#7586](https://github.com/microsoft/typespec/pull/7586) Improved the error message for the `@pattern` decorator when applied to a `union` type. The new message is more descriptive and helps users understand how to correctly define string-compatible union types.
- [#7740](https://github.com/microsoft/typespec/pull/7740) Config interpolation is more flexible in interpolating variables in any order as long as no circular reference occur. For example using `{output-dir}` in parameters.
- [#7731](https://github.com/microsoft/typespec/pull/7731) Fix literal typekits `$.literal.create`, `$.literal.createString`, etc. use right checker api that include caching
- [#7906](https://github.com/microsoft/typespec/pull/7906) Corrected some logic around the detection of array types in visibility calculation.

### @typespec/http

- [#7849](https://github.com/microsoft/typespec/pull/7849) Fix optional path parameter with explicit name would have the wrong style(`path` instead of `simple`).

### @typespec/openapi3

- [#7750](https://github.com/microsoft/typespec/pull/7750) Prepends namespace name to array declarations in nested namespaces.
- [#7864](https://github.com/microsoft/typespec/pull/7864) Fixed a bug that caused `model M is T[]` declarations to be renamed to `MItem` incorrectly.

### @typespec/html-program-viewer

- [#7834](https://github.com/microsoft/typespec/pull/7834) Fix type state not showing in program viewer
