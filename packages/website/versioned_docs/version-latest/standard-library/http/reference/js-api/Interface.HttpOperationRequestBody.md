---
jsApi: true
title: "[I] HttpOperationRequestBody"

---
Represent the body information for an http request.

## Note

the `type` must be a `Model` if the content type is multipart.

## Extends

- [`HttpOperationBody`](Interface.HttpOperationBody.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `contentTypes` | `string`[] | Content types. |
| `parameter`? | `ModelProperty` | If the body was explicitly set as a property. Correspond to the property with `@body` |
| `type` | `Type` | Type of the operation body. |
