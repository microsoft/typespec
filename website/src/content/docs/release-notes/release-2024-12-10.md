---
title: 0.63 - December 2024
releaseDate: 2024-12-10
version: "0.63"
---

## Notable changes

### Experimental: Improve Realm, Mutator, and Typekit implementations

The compiler strongly binds a Realm and Typekit together, and changes mutators so that new types are cloned within the mutator's realm. The default Typekit now creates a default typekit realm for the current program, and a Typekit can be easily created to work in a specific Program or Realm as needed.

### Enum-driven Visibility

A new mechanism for visibility that defines valid visibility values in enums and provides tools for filtering types by visibility. A new `LifecycleVisibility` enum defines standard protocol-agnostic visibility values for operations that manage the lifecycle (creation, update, deletion) of a resource. More details on visibility enums are available [in website documentation](../language-basics/visibility.md)

## Features

### @typespec/compiler

- [#4937](https://github.com/microsoft/typespec/pull/4937) Add mutateSubgraphWithNamespace as a separate API
- [#4837](https://github.com/microsoft/typespec/pull/4837) Allow trailing delimiter in array values, tuple, decorator declaration, scalar initializer, etc.
- [#5149](https://github.com/microsoft/typespec/pull/5149) Experimental: Improve Realm, Mutator, and Typekit implementations.

- [#4825](https://github.com/microsoft/typespec/pull/4825) Adds support for enum-driven visibility in the compiler core.

### @typespec/openapi3

- [#5029](https://github.com/microsoft/typespec/pull/5029) Add support for `#deprecated` for OpenAPI3Parameter

## Bug Fixes

### @typespec/compiler

- [#5252](https://github.com/microsoft/typespec/pull/5252) Added RegEx validation for @pattern and will throw warning for invalid RegEx string

### @typespec/http

- [#5016](https://github.com/microsoft/typespec/pull/5016) Uri template attributes were not extracted when parameter was explicitly mark with `@path` or `@query` as well

### @typespec/http-server-csharp

- [#4308](https://github.com/microsoft/typespec/issues/4308) Process sub-namespaces of a service
- [#4998](https://github.com/microsoft/typespec/issues/4998) Handle void returnType
- [#5000](https://github.com/microsoft/typespec/issues/5000) Handle tuple literals
- [#5001](https://github.com/microsoft/typespec/issues/5001) Skip envelope types withpout properties
- [#5024](https://github.com/microsoft/typespec/issues/5024) Literal type is not properly generated
- [#5124](https://github.com/microsoft/typespec/issues/5124) Skip uninstantiated templates
- [#5125](https://github.com/microsoft/typespec/issues/5125) Process operations outside interfaces
- Handle nullable types and anonymous typesin all contexts
- Add server-side numeric constraints for safeInt

### @typespec/http-server-javascript

- Add an additional check for the presence of a property before performing a bounds check on integer properties constrained to a range.
- [5185](https://github.com/microsoft/typespec/issues/5185) Add logic to handle invalid identifier names (#5185)

### @typespec/versioning

- [#5262](https://github.com/microsoft/typespec/pull/5262) Fixes diagnostics for @typeChangedFrom to properly detect when an incompatible version is referenced inside of a template, union, or tuple.

### @typespec/openapi3

- [#5006](https://github.com/microsoft/typespec/pull/5006) Illegal characters in component keys
- [#5274](https://github.com/microsoft/typespec/pull/5274) Added missing peer dependency "openapi-types"

### @typespec/json-schema

- [#5189](https://github.com/microsoft/typespec/pull/5189) Fixes crash that occurred when a template instantiation's template argument was a union that references a declaration.
