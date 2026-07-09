---
title: "Diagnostics"
---

The following diagnostics can be reported by this library.

| Code                                                                                     | Severity | Description                                                                                             |
| ---------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `@typespec/openapi3/default-not-supported`                                               | warning  |                                                                                                         |
| [`@typespec/openapi3/duplicate-header`](./diagnostics/duplicate-header.md)               | error    | A response header is defined more than once for a response of a specific status code.                   |
| `@typespec/openapi3/empty-enum`                                                          | error    |                                                                                                         |
| `@typespec/openapi3/empty-union`                                                         | error    |                                                                                                         |
| `@typespec/openapi3/enum-strategy-not-supported`                                         | warning  |                                                                                                         |
| `@typespec/openapi3/enum-unique-type`                                                    | error    |                                                                                                         |
| `@typespec/openapi3/inconsistent-shared-route-request-visibility`                        | error    |                                                                                                         |
| [`@typespec/openapi3/inline-cycle`](./diagnostics/inline-cycle.md)                       | error    | A cyclic reference was detected within inline schemas.                                                  |
| `@typespec/openapi3/invalid-component-fixed-field-key`                                   | warning  |                                                                                                         |
| `@typespec/openapi3/invalid-format`                                                      | warning  |                                                                                                         |
| `@typespec/openapi3/invalid-model-property`                                              | error    |                                                                                                         |
| [`@typespec/openapi3/invalid-schema`](./diagnostics/invalid-schema.md)                   | error    | A schema is invalid according to the OpenAPI v3 specification.                                          |
| [`@typespec/openapi3/invalid-server-variable`](./diagnostics/invalid-server-variable.md) | error    | A variable in the `@server` decorator is not assignable to `string`.                                    |
| `@typespec/openapi3/invalid-style`                                                       | warning  |                                                                                                         |
| `@typespec/openapi3/oneof-union`                                                         | error    |                                                                                                         |
| [`@typespec/openapi3/path-query`](./diagnostics/path-query.md)                           | error    | An `@route` path contains a query parameter, which OpenAPI v3 does not allow.                           |
| `@typespec/openapi3/path-reserved-expansion`                                             | warning  |                                                                                                         |
| `@typespec/openapi3/resource-namespace`                                                  | error    |                                                                                                         |
| `@typespec/openapi3/status-code-in-default-response`                                     | error    |                                                                                                         |
| `@typespec/openapi3/streams-not-supported`                                               | warning  |                                                                                                         |
| [`@typespec/openapi3/union-null`](./diagnostics/union-null.md)                           | error    | The result of model composition is effectively a `null` schema, which cannot be represented in OpenAPI. |
| `@typespec/openapi3/unsupported-auth`                                                    | warning  |                                                                                                         |
| `@typespec/openapi3/unsupported-status-code-range`                                       | error    |                                                                                                         |
| `@typespec/openapi3/xml-attribute-invalid-property-type`                                 | warning  |                                                                                                         |
| `@typespec/openapi3/xml-unwrapped-invalid-property-type`                                 | warning  |                                                                                                         |
