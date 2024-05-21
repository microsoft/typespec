---
jsApi: true
title: "[I] HttpOperationRequestBody"

---
Represent the body information for an http request.

## Note

the `type` must be a `Model` if the content type is multipart.

## Extends

- [`HttpOperationBody`](HttpOperationBody.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `containsMetadataAnnotations` | `readonly` | `boolean` | If the body contains metadata annotations to ignore. For example `@header`. | [`HttpOperationBody`](HttpOperationBody.md).`containsMetadataAnnotations` |
| `contentTypes` | `public` | `string`[] | Content types. | [`HttpOperationBody`](HttpOperationBody.md).`contentTypes` |
| `isExplicit` | `readonly` | `boolean` | If the body was explicitly set with `@body`. | [`HttpOperationBody`](HttpOperationBody.md).`isExplicit` |
| `parameter?` | `public` | `ModelProperty` | If the body was explicitly set as a property. Correspond to the property with `@body` or `@bodyRoot` | - |
| `type` | `public` | `Type` | Type of the operation body. | [`HttpOperationBody`](HttpOperationBody.md).`type` |
