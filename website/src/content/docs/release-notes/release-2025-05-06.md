---
title: "1.0.0"
releaseDate: 2025-05-06
version: "1.0.0"
---

## TypeSpec 1.0 Release

Today, we’re thrilled to announce the general availability of TypeSpec 1.0! This milestone marks the transition of TypeSpec’s core components from release candidate to stable release status. TypeSpec is a Microsoft-built, community-supported project that makes API-first development truly practical by empowering you to define your APIs in a concise, human-readable format and generate all the artifacts you need—from OpenAPI specifications to client libraries and server code scaffolding—from a single source of truth.

[See our blog post](https://typespec.io/blog/typespec-1-0-GA-release/)

## Breaking Changes

### @typespec/http

- [#7230](https://github.com/microsoft/typespec/pull/7230) Changed `@patch` so that it does not apply the "implicit optionality" transform by default anymore.

  ```diff lang=tsp
  @patch op update(@body pet: Pet): void;
  ```

  To use JSON Merge-Patch to update resources, replace the body property with an instance of `MergePatchUpdate` as follows:

  ```tsp
  @patch op update(@body pet: MergePatchUpdate<Pet>): void;
  ```

  Or, keep the old behavior by explicitly enabling `implicitOptionality` in the `@patch` options:

  ```tsp
  @patch(#{ implicitOptionality: true }) op update(@body pet: Pet): void;
  ```

## Features

### @typespec/compiler

- [#7199](https://github.com/microsoft/typespec/pull/7199) Add "capitalize" string helper to compiler
- [#7180](https://github.com/microsoft/typespec/pull/7180) Add support for formatting `tspconfig.yaml` with `tsp format`
- [#7180](https://github.com/microsoft/typespec/pull/7180) `tsp format` only formats files it knows about and ignores other. Allowing a more generic glob pattern `tsp format .` or `tsp format "**/*"`
- [#5674](https://github.com/microsoft/typespec/pull/5674) [LSP] Update imports when renaming typespec files
- [#7125](https://github.com/microsoft/typespec/pull/7125) Adds typekits for getting intrinsic types via `$.intrinsic.<type>`
- [#7204](https://github.com/microsoft/typespec/pull/7204) Update typekits `is*` methods to accept `Entity` instead of just `Type` or `Value`
- [#7108](https://github.com/microsoft/typespec/pull/7108) Adds support for nesting typekits
- [#7202](https://github.com/microsoft/typespec/pull/7202) Replaces `$.model.getSpreadType` with `$.model.getIndexType` to better reflect what it actually being returned. `getSpreadType` did not actually return a list of spread types, but the model's indexer type instead.
- [#7090](https://github.com/microsoft/typespec/pull/7090) Adds TypeKit support for type.inNamespace to check namespace membership
- [#7167](https://github.com/microsoft/typespec/pull/7167) Adds `$.value.resolve` and `$.type.resolve` typekits, and updated `$.resolve` to return values or types, instead of just types
- [#7106](https://github.com/microsoft/typespec/pull/7106) Adds `$.type.isAssignableTo`, `$.value.isAssignableTo` and `$.entity.isAssignableTo` typekits. Also registers `$.resolve` typekit
- [#7193](https://github.com/microsoft/typespec/pull/7193) Typekits have been moved out of experimental and can now be accessed via the `@typespec/compiler/typekit` submodule.
  This also removed the `$.type.getDiscriminator` typekit in favor of the `$.model.getDiscriminatedUnion` and `$.union.getDiscriminatedUnion`
  typkits.

  ```diff
  -import { $ } from "@typespec/compiler/experimental/typekit";
  +import { $ } from "@typespec/compiler/typekit";
  ```

- [#7105](https://github.com/microsoft/typespec/pull/7105) Add typekit support for creating a union from an array of children
- [#7207](https://github.com/microsoft/typespec/pull/7207) Exposed experimental function `isMutableType` as `unsafe_isMutableType`.
- [#7200](https://github.com/microsoft/typespec/pull/7200) Added an optional `nameTemplate` argument to `@withVisibilityFilter`, allowing the visibility filters to rename models as they are transformed. This template is applied by default in the `Create`, `Read`, `Update`, `Delete`, and `Query` visibility transform templates. This allows for more flexible renaming than simply using the `@friendlyName` decorator, as it will change the primary name of the transformed type, reducing the incidence of naming conflicts.

  Cached the result of applying visibility filters to types. If the same visibility filter is applied to the same type with the same configuration, the model instance produced by the visibility filter will be object-identical. This should reduce the incidence of multiple models that are structurally equivalent in visibility filters and conflicts over the name of models.

### @typespec/http

- [#7207](https://github.com/microsoft/typespec/pull/7207) Implemented JSON Merge-Patch wrappers. This allows converting a type to a JSON Merge-Patch compatible update record using the `MergePatchUpdate` and `MergePatchCreateOrUpdate` templates.

### @typespec/openapi3

- [#7199](https://github.com/microsoft/typespec/pull/7199) Add "capitalize" string helper to compiler

### typespec-vscode

- [#7042](https://github.com/microsoft/typespec/pull/7042) send compile startTime and endTime telemetry

## Bug Fixes

### @typespec/compiler

- [#7183](https://github.com/microsoft/typespec/pull/7183) Fix decorators on model properties getting wrongly called when checking the template declaration in the following cases
  - inside a union expression
  - under an non templated operation under a templated interface
- [#6938](https://github.com/microsoft/typespec/pull/6938) Fixes template argument resolution when a default template parameter value is resolved by a parent container (e.g. interface)
  For example:

  ```tsp
  interface Resource<T> {
    read<U = T>(): U;
  }

  model Foo {
    type: "foo";
  }

  alias FooResource = Resource<Foo>;

  op readFoo is FooResource.read;
  ```

  The `returnType` for `readFoo` would be model `Foo`. Previously the `returnType` resolved to a `TemplateParameter`.

- [#7153](https://github.com/microsoft/typespec/pull/7153) Fixes handling of nested templates in getPlausibleName
- [#6883](https://github.com/microsoft/typespec/pull/6883) Realm handle multiple instance of compiler loaded at once
- [#7222](https://github.com/microsoft/typespec/pull/7222) Remove `version` property on `ServiceOptions` passed to `@service` decorator. That handling of that option was removed in `1.0.0-rc.0` where it was previously deprecated.
  If wanting to specify version in an OpenAPI document use the `@OpenAPI.info` decorator from the `@typespec/openapi` library
- [#7155](https://github.com/microsoft/typespec/pull/7155) Mark `TemplateParameter` type as an experimental type
- [#7106](https://github.com/microsoft/typespec/pull/7106) Removes `program.checker.isTypeAssignableTo`. Use one of the following typekits instead:
  - `$(program).type.isAssignableTo`
  - `$(program).value.isAssignableTo`
  - `$(program).entity.isAssignableTo`
- [#7207](https://github.com/microsoft/typespec/pull/7207) Weakened rules around `@mediaTypeHint` decorator, allowing media type hints with suffixes like "application/merge-patch+json".
- [#7200](https://github.com/microsoft/typespec/pull/7200) Fixed an error in Model visibility filtering where the indexer of a model was ignored. This prevented the value of Array/Record instances from being transformed correctly, as they now should be.

### @typespec/http

- [#7168](https://github.com/microsoft/typespec/pull/7168) Replace optional param validation requiring use with path expansion and replace with a warning when the resulting url might have a double `/`
