# Change Log - @typespec/graphql

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
