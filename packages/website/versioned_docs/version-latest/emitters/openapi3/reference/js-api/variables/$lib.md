---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<object, OpenAPI3EmitterOptions, never>;
```

## Type declaration

| Name | Type | Default value |
| ------ | ------ | ------ |
| `duplicate-header` | `object` | - |
| `duplicate-header.default` | `CallableMessage`<[`"header"`]\> | - |
| `empty-enum` | `object` | - |
| `empty-enum.default` | `"Empty enums are not supported for OpenAPI v3 - enums must have at least one value."` | "Empty enums are not supported for OpenAPI v3 - enums must have at least one value." |
| `empty-union` | `object` | - |
| `empty-union.default` | `"Empty unions are not supported for OpenAPI v3 - enums must have at least one value."` | "Empty unions are not supported for OpenAPI v3 - enums must have at least one value." |
| `enum-unique-type` | `object` | - |
| `enum-unique-type.default` | `"Enums are not supported unless all options are literals of the same type."` | "Enums are not supported unless all options are literals of the same type." |
| `inconsistent-shared-route-request-visibility` | `object` | - |
| `inconsistent-shared-route-request-visibility.default` | "All operations with \`@sharedRoutes\` must have the same \`@requestVisibility\`." | "All operations with \`@sharedRoutes\` must have the same \`@requestVisibility\`." |
| `inline-cycle` | `object` | - |
| `inline-cycle.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-default` | `object` | - |
| `invalid-default.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-format` | `object` | - |
| `invalid-format.default` | `CallableMessage`<[`"value"`, `"paramType"`]\> | - |
| `invalid-model-property` | `object` | - |
| `invalid-model-property.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-schema` | `object` | - |
| `invalid-schema.default` | `CallableMessage`<[`"type"`]\> | - |
| `invalid-server-variable` | `object` | - |
| `invalid-server-variable.default` | `CallableMessage`<[`"propName"`]\> | - |
| `invalid-style` | `object` | - |
| `invalid-style.default` | `CallableMessage`<[`"style"`, `"paramType"`]\> | - |
| `oneof-union` | `object` | - |
| `oneof-union.default` | `"@oneOf decorator can only be used on a union or a model property which type is a union."` | "@oneOf decorator can only be used on a union or a model property which type is a union." |
| `path-query` | `object` | - |
| `path-query.default` | `"OpenAPI does not allow paths containing a query string."` | - |
| `path-reserved-expansion` | `object` | - |
| `path-reserved-expansion.default` | `"Reserved expansion of path parameter with '+' operator #{allowReserved: true} is not supported in OpenAPI3."` | - |
| `resource-namespace` | `object` | - |
| `resource-namespace.default` | `"Resource goes on namespace"` | "Resource goes on namespace" |
| `status-code-in-default-response` | `object` | - |
| `status-code-in-default-response.default` | `"a default response should not have an explicit status code"` | "a default response should not have an explicit status code" |
| `union-null` | `object` | - |
| `union-null.default` | `"Cannot have a union containing only null types."` | "Cannot have a union containing only null types." |
| `unsupported-auth` | `object` | - |
| `unsupported-auth.default` | `CallableMessage`<[`"authType"`]\> | - |
| `unsupported-status-code-range` | `object` | - |
| `unsupported-status-code-range.default` | `CallableMessage`<[`"start"`, `"end"`]\> | - |
