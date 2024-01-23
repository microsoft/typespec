---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<Object, OpenAPI3EmitterOptions, never>;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `duplicate-body` | `Object` | - |
| `duplicate-body.default` | `"Duplicate @body declarations on response type"` | - |
| `duplicate-header` | `Object` | - |
| `duplicate-header.default` | `CallableMessage`<[`"header"`]\> | - |
| `empty-enum` | `Object` | - |
| `empty-enum.default` | `"Empty enums are not supported for OpenAPI v3 - enums must have at least one value."` | - |
| `empty-union` | `Object` | - |
| `empty-union.default` | `"Empty unions are not supported for OpenAPI v3 - enums must have at least one value."` | - |
| `enum-unique-type` | `Object` | - |
| `enum-unique-type.default` | `"Enums are not supported unless all options are literals of the same type."` | - |
| `inconsistent-shared-route-request-visibility` | `Object` | - |
| `inconsistent-shared-route-request-visibility.default` | "All operations with \`@sharedRoutes\` must have the same \`@requestVisibility\`." | - |
| `inline-cycle` | `Object` | - |
| `inline-cycle.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-default` | `Object` | - |
| `invalid-default.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-format` | `Object` | - |
| `invalid-format.default` | `CallableMessage`<[`"value"`, `"paramType"`]\> | - |
| `invalid-schema` | `Object` | - |
| `invalid-schema.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-server-variable` | `Object` | - |
| `invalid-server-variable.default` | `CallableMessage`<[`"propName"`]\> | - |
| `oneof-union` | `Object` | - |
| `oneof-union.default` | `"@oneOf decorator can only be used on a union or a model property which type is a union."` | - |
| `path-query` | `Object` | - |
| `path-query.default` | `"OpenAPI does not allow paths containing a query string."` | - |
| `resource-namespace` | `Object` | - |
| `resource-namespace.default` | `"Resource goes on namespace"` | - |
| `status-code-in-default-response` | `Object` | - |
| `status-code-in-default-response.default` | `"a default response should not have an explicit status code"` | - |
| `union-null` | `Object` | - |
| `union-null.default` | `"Cannot have a union containing only null types."` | - |
| `unsupported-status-code-range` | `Object` | - |
| `unsupported-status-code-range.default` | `CallableMessage`<[`"start"`, `"end"`]\> | - |
