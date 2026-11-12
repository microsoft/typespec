# Change Log - @typespec/graphql

## 0.5.0

### Features

- [#12461](https://github.com/microsoft/typespec/pull/12461) Add `typeref(Type)` for referencing types from metadata values. Enable the `typeref` compiler feature in the calling project or library's `tspconfig.yaml`. Its result has type `TypeRef<T>`, where `T` is the referenced type. Use `TypeRef` to accept any type reference, or `TypeRef<T>` to constrain its target. JavaScript implementations and generated signatures use `TypeRefValue` from `@typespec/compiler`, whose `target` is the referenced compiler type. Type references are compilation metadata and cannot be represented as JSON values.
  
  ```typespec
  model Item { id: string; }
  model Registration { name: string; type: TypeRef; }
  const entry: Registration = #{ name: "item", type: typeref(Item) };
  ```

### Bug Fixes

- [#12225](https://github.com/microsoft/typespec/pull/12225) Preserve source model and property documentation in generated extern signatures.


## 0.4.0

### Bug Fixes

- [#11960](https://github.com/microsoft/typespec/pull/11960) Prevent TypeSpec-authored paths from escaping template and emitter output directories.
- [#11019](https://github.com/microsoft/typespec/pull/11019) Set the required `expression` field to `false` when creating a replacement scalar so scalars produced by the model mutation engine are valid declaration types.


## 0.3.0

No changes, version bump only.

## 0.2.0

### Bug Fixes

- [#11565](https://github.com/microsoft/typespec/pull/11565) Add `./mutation-engine` subpath export for standalone mutation pipeline usage


## 0.1.0

### Features

- Initial release of the GraphQL emitter
- Support for `@query`, `@mutation`, and `@subscription` operation decorators
- Support for `@graphqlInterface` decorator to mark models as GraphQL interfaces
- Support for `@compose` decorator to implement interfaces
- Support for `@operationFields` decorator to add operations to models
- Support for `@specifiedBy` decorator for custom scalar URLs
- Automatic input type generation with `Input` suffix
- `@oneOf` input generation for union-as-input parameters
- Visibility-based input/output type splitting
- Union flattening and scalar wrapper generation
