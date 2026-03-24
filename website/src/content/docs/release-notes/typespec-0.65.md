---
title: 0.65 - February 2025
releaseDate: 2025-02-11
version: "0.65"
---

:::note
This release contains deprecations
:::

## Notables features

### Converting Json/JS like object to tsp values is easier

Previously the quick fix to convert a model expression or tuple to an object/array value would only apply at one level. It is now applied to the entire value allowing for easier conversion of complex objects.

```tsp
@example({
  a: 1,
  b: 2,
  c: {
    d: 3,
    e: 4,
    f: [5, 6, 7]
  }
})
```

Will be converted to this with the quick fix:

```tsp
@example(#{
  a: 1,
  b: 2,
  c: #{
    d: 3,
    e: 4,
    f: #[5, 6, 7]
  }
})
```

### Additional completion in the tspconfig.yaml

IDE support for the `tspconfig.yaml` was improved adding completion for the `extends` field, `imports`, `rule`, `rule sets` and `variables`. The completion items now also show required/optional information in the details of emitter's options.

## Deprecations

### @typespec/compiler

- [#4931](https://github.com/microsoft/typespec/pull/4931) Deprecate experimental projection. Projection will be removed in version 0.66

### @typespec/versioning

- [#4931](https://github.com/microsoft/typespec/pull/4931) Deprecate versioning projection, switch to the mutator approach

```diff lang="tsp"
// Step 1: Update to retrieve the mutation instead of projections
-const versions = buildVersionProjections(program, service.type);
+const versions = getVersioningMutators(program, service.type);

// Step 2: call mutator instead of projection api
-const projectedProgram = projectProgram(originalProgram, versionRecord.projections);
+const subgraph = unsafe_mutateSubgraphWithNamespace(program, [mutator], service.type);
+subgraph.type // this is the mutated service namespace
```

## Features

### @typespec/compiler

- [#5572](https://github.com/microsoft/typespec/pull/5572) Add support for [ESM subpath imports](https://nodejs.org/api/packages.html#subpath-imports)
- [#5790](https://github.com/microsoft/typespec/pull/5790) Add option for semantic walker to visit model derived types
- [#5340](https://github.com/microsoft/typespec/pull/5340) Add Experimental Typekit helpers for `@typespec/http`
- [#5716](https://github.com/microsoft/typespec/pull/5716) Updated Rest init template to include additional emitters(client, server) and a basic sample.
- [#5186](https://github.com/microsoft/typespec/pull/5186) Support the auto completion for extends, imports, rule, rule sets and variables in tspconfig.yaml
- [#5186](https://github.com/microsoft/typespec/pull/5186) Show required/optional information in the details of emitter's options completion item in tspconfig.yaml
- [#5342](https://github.com/microsoft/typespec/pull/5342) Convert model/tuple expression to value code fix is applied to the entire value.
- [#5824](https://github.com/microsoft/typespec/pull/5824) `tsp init` will not automatically run `tsp install` if a `package.json` file is created.
- [#4931](https://github.com/microsoft/typespec/pull/4931) [Experimental] Update to subgraph mutator to visit all missing relations
- [#5416](https://github.com/microsoft/typespec/pull/5416) Added APIs for getting parameterVisibility and returnTypeVisibility as VisibilityFilter objects.
- [#5699](https://github.com/microsoft/typespec/pull/5699) Promote `unsafe_useStateMap` and `unsafe_useStateSet` experimental APIs to stable version `useStateMap` and `useStateSet`. Old ones are deprecated

### @typespec/http

- [#5340](https://github.com/microsoft/typespec/pull/5340) Add Experimental Typekit helpers for `@typespec/http`

### @typespec/versioning

- [#5459](https://github.com/microsoft/typespec/pull/5459) add code fixes for incompatible version errors
- [#4931](https://github.com/microsoft/typespec/pull/4931) Provide new mutator based way of getting version snapshot

### @typespec/rest

- [#5685](https://github.com/microsoft/typespec/pull/5685) Updates `CollectionWithNextLink` to support pagination

### @typespec/openapi3

- [#5831](https://github.com/microsoft/typespec/pull/5831) Updates tsp-openapi3 operation response generation to inline expressions and pare down fields with default values. Also adds support for Open API headers and responses $refs.
- [#4931](https://github.com/microsoft/typespec/pull/4931) Migrate versioning implementation to use mutator approach.

### typespec-vscode

- [#5451](https://github.com/microsoft/typespec/pull/5451) Support importing TypeSpec from OpenAPI 3.0 doc

## Bug Fixes

### @typespec/compiler

- [#5940](https://github.com/microsoft/typespec/pull/5940) Fix: Infinite loop in language server due to not caching indeterminate entities in templates
- [#5186](https://github.com/microsoft/typespec/pull/5186) Fix the issue that extra " will be added when auto completing emitter options inside ""
- [#5833](https://github.com/microsoft/typespec/pull/5833) Fix tracing in `SourceLoader`

### @typespec/openapi3

- [#5893](https://github.com/microsoft/typespec/pull/5893) Updates tsp-openapi3 to support $ref in requestBodies

### typespec-vs

- [#5834](https://github.com/microsoft/typespec/pull/5834) Update extension configuration URLs in error message

### typespec-vscode

- [#5752](https://github.com/microsoft/typespec/pull/5752) Disable coloring text when generating code
- [#5754](https://github.com/microsoft/typespec/pull/5754) Add example to the vscode setting "initTemplatesUrls"
- [#5886](https://github.com/microsoft/typespec/pull/5886) refine the quickpick placeholder and the log
- [#5834](https://github.com/microsoft/typespec/pull/5834) Update extension configuration URLs in error message
