---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<object, Record<string, any>, 
  | "file"
  | "statusCode"
  | "body"
  | "header"
  | "path"
  | "query"
  | "authentication"
  | "bodyRoot"
  | "bodyIgnore"
  | "multipartBody"
  | "verbs"
  | "servers"
  | "includeInapplicableMetadataInPayload"
  | "externalInterfaces"
  | "routeProducer"
  | "routes"
  | "sharedRoutes"
  | "routeOptions"
| "httpPart">;
```

## Type declaration

| Member | Type | Value |
| :------ | :------ | :------ |
| `content-type-ignored` | `object` | ... |
| `content-type-ignored.default` | "\`Content-Type\` header ignored because there is no body." | "\`Content-Type\` header ignored because there is no body." |
| `content-type-string` | `object` | ... |
| `content-type-string.default` | `"contentType parameter must be a string literal or union of string literals"` | "contentType parameter must be a string literal or union of string literals" |
| `duplicate-body` | `object` | ... |
| `duplicate-body.bodyAndUnannotated` | `"Operation has a @body and an unannotated parameter. There can only be one representing the body"` | "Operation has a @body and an unannotated parameter. There can only be one representing the body" |
| `duplicate-body.default` | `"Operation has multiple @body parameters declared"` | "Operation has multiple @body parameters declared" |
| `duplicate-body.duplicateUnannotated` | `"Operation has multiple unannotated parameters. There can only be one representing the body"` | "Operation has multiple unannotated parameters. There can only be one representing the body" |
| `duplicate-operation` | `object` | ... |
| `duplicate-operation.default` | `CallableMessage`<[`string`, `string`, `string`]\> | ... |
| `duplicate-route-decorator` | `object` | ... |
| `duplicate-route-decorator.namespace` | `"@route was defined twice on this namespace and has different values."` | "@route was defined twice on this namespace and has different values." |
| `formdata-no-part-name` | `object` | ... |
| `formdata-no-part-name.default` | `"Part used in multipart/form-data must have a name."` | "Part used in multipart/form-data must have a name." |
| `header-format-required` | `object` | ... |
| `header-format-required.default` | "A format must be specified for @header when type is an array. e.g. @header(\{format: \"csv\"\})" | ... |
| `http-file-extra-property` | `object` | ... |
| `http-file-extra-property.default` | `CallableMessage`<[`string`]\> | ... |
| `http-verb-duplicate` | `object` | ... |
| `http-verb-duplicate.default` | `CallableMessage`<[`string`]\> | ... |
| `http-verb-wrong-type` | `object` | ... |
| `http-verb-wrong-type.default` | `CallableMessage`<[`string`, `string`]\> | ... |
| `invalid-type-for-auth` | `object` | ... |
| `invalid-type-for-auth.default` | `CallableMessage`<[`string`]\> | ... |
| `metadata-ignored` | `object` | ... |
| `metadata-ignored.default` | `CallableMessage`<[`string`]\> | ... |
| `missing-path-param` | `object` | ... |
| `missing-path-param.default` | `CallableMessage`<[`string`]\> | ... |
| `missing-server-param` | `object` | ... |
| `missing-server-param.default` | `CallableMessage`<[`string`]\> | ... |
| `multipart-invalid-content-type` | `object` | ... |
| `multipart-invalid-content-type.default` | `CallableMessage`<[`string`, `string`]\> | ... |
| `multipart-model` | `object` | ... |
| `multipart-model.default` | `"Multipart request body must be a model."` | "Multipart request body must be a model." |
| `multipart-nested` | `object` | ... |
| `multipart-nested.default` | `"Cannot use @multipartBody inside of an HttpPart"` | "Cannot use @multipartBody inside of an HttpPart" |
| `multipart-part` | `object` | ... |
| `multipart-part.default` | `"Expect item to be an HttpPart model."` | "Expect item to be an HttpPart model." |
| `multiple-status-codes` | `object` | ... |
| `multiple-status-codes.default` | "Multiple \`@statusCode\` decorators defined for this operation response." | "Multiple \`@statusCode\` decorators defined for this operation response." |
| `no-service-found` | `object` | ... |
| `no-service-found.default` | `CallableMessage`<[`string`]\> | ... |
| `operation-param-duplicate-type` | `object` | ... |
| `operation-param-duplicate-type.default` | `CallableMessage`<[`string`, `string`]\> | ... |
| `optional-path-param` | `object` | ... |
| `optional-path-param.default` | `CallableMessage`<[`string`]\> | ... |
| `query-format-required` | `object` | ... |
| `query-format-required.default` | "A format must be specified for @query when type is an array. e.g. @query(\{format: \"multi\"\})" | ... |
| `shared-inconsistency` | `object` | ... |
| `shared-inconsistency.default` | `CallableMessage`<[`string`, `string`]\> | ... |
| `status-code-invalid` | `object` | ... |
| `status-code-invalid.default` | `"statusCode value must be a numeric or string literal or union of numeric or string literals"` | "statusCode value must be a numeric or string literal or union of numeric or string literals" |
| `status-code-invalid.value` | `"statusCode value must be a three digit code between 100 and 599"` | "statusCode value must be a three digit code between 100 and 599" |
| `write-visibility-not-supported` | `object` | ... |
| `write-visibility-not-supported.default` | "@visibility(\"write\") is not supported. Use @visibility(\"update\"), @visibility(\"create\") or @visibility(\"create\", \"update\") as appropriate." | ... |
