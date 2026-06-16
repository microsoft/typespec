# Change Log - @typespec/graphql

## 0.1.0

### Features

- Initial release of the GraphQL emitter
- Support for `@query`, `@mutation`, and `@subscription` operation decorators
- Support for `@Interface` decorator to mark models as GraphQL interfaces
- Support for `@compose` decorator to implement interfaces
- Support for `@operationFields` decorator to add operations to models
- Support for `@specifiedBy` decorator for custom scalar URLs
- Automatic input type generation with `Input` suffix
- `@oneOf` input generation for union-as-input parameters
- Visibility-based input/output type splitting
- Union flattening and scalar wrapper generation
