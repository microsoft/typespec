---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<Object, Record<string, any>, 
  | "statusCode"
  | "body"
  | "header"
  | "path"
  | "query"
  | "authentication"
  | "verbs"
  | "servers"
  | "includeInapplicableMetadataInPayload"
  | "externalInterfaces"
  | "routeProducer"
  | "routes"
  | "sharedRoutes"
| "routeOptions">;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `content-type-ignored` | `Object` | - |
| `content-type-ignored.default` | "\`Content-Type\` header ignored because there is no body." | - |
| `content-type-string` | `Object` | - |
| `content-type-string.default` | `"contentType parameter must be a string literal or union of string literals"` | - |
| `duplicate-body` | `Object` | - |
| `duplicate-body.bodyAndUnannotated` | `"Operation has a @body and an unannotated parameter. There can only be one representing the body"` | - |
| `duplicate-body.default` | `"Operation has multiple @body parameters declared"` | - |
| `duplicate-body.duplicateUnannotated` | `"Operation has multiple unannotated parameters. There can only be one representing the body"` | - |
| `duplicate-operation` | `Object` | - |
| `duplicate-operation.default` | `CallableMessage`<[`string`, `string`, `string`]\> | - |
| `duplicate-route-decorator` | `Object` | - |
| `duplicate-route-decorator.namespace` | `"@route was defined twice on this namespace and has different values."` | - |
| `header-format-required` | `Object` | - |
| `header-format-required.default` | `"A format must be specified for @header when type is an array. e.g. @header({format: \"csv\"})"` | - |
| `http-verb-duplicate` | `Object` | - |
| `http-verb-duplicate.default` | `CallableMessage`<[`string`]\> | - |
| `http-verb-wrong-type` | `Object` | - |
| `http-verb-wrong-type.default` | `CallableMessage`<[`string`, `string`]\> | - |
| `invalid-type-for-auth` | `Object` | - |
| `invalid-type-for-auth.default` | `CallableMessage`<[`string`]\> | - |
| `missing-path-param` | `Object` | - |
| `missing-path-param.default` | `CallableMessage`<[`string`]\> | - |
| `missing-server-param` | `Object` | - |
| `missing-server-param.default` | `CallableMessage`<[`string`]\> | - |
| `multipart-model` | `Object` | - |
| `multipart-model.default` | `"Multipart request body must be a model."` | - |
| `multiple-status-codes` | `Object` | - |
| `multiple-status-codes.default` | "Multiple \`@statusCode\` decorators defined for this operation response." | - |
| `no-service-found` | `Object` | - |
| `no-service-found.default` | `CallableMessage`<[`string`]\> | - |
| `operation-param-duplicate-type` | `Object` | - |
| `operation-param-duplicate-type.default` | `CallableMessage`<[`string`, `string`]\> | - |
| `optional-path-param` | `Object` | - |
| `optional-path-param.default` | `CallableMessage`<[`string`]\> | - |
| `query-format-required` | `Object` | - |
| `query-format-required.default` | `"A format must be specified for @query when type is an array. e.g. @query({format: \"multi\"})"` | - |
| `shared-inconsistency` | `Object` | - |
| `shared-inconsistency.default` | `"All shared routes must agree on the value of the shared parameter."` | - |
| `status-code-invalid` | `Object` | - |
| `status-code-invalid.default` | `"statusCode value must be a numeric or string literal or union of numeric or string literals"` | - |
| `status-code-invalid.value` | `"statusCode value must be a three digit code between 100 and 599"` | - |
| `write-visibility-not-supported` | `Object` | - |
| `write-visibility-not-supported.default` | `"@visibility(\"write\") is not supported. Use @visibility(\"update\"), @visibility(\"create\") or @visibility(\"create\", \"update\") as appropriate."` | - |
