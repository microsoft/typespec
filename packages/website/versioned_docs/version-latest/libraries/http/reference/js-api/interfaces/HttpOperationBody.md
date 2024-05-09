---
jsApi: true
title: "[I] HttpOperationBody"

---
## Extended by

- [`HttpOperationRequestBody`](HttpOperationRequestBody.md)
- [`HttpOperationResponseBody`](HttpOperationResponseBody.md)

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `containsMetadataAnnotations` | `readonly` | `boolean` | If the body contains metadata annotations to ignore. For example `@header`. |
| `contentTypes` | `public` | `string`[] | Content types. |
| `isExplicit` | `readonly` | `boolean` | If the body was explicitly set with `@body`. |
| `type` | `public` | `Type` | Type of the operation body. |
