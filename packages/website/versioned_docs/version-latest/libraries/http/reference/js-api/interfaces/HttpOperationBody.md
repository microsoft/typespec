---
jsApi: true
title: "[I] HttpOperationBody"

---
## Extends

- [`HttpOperationBodyBase`](HttpOperationBodyBase.md).[`HttpBody`](HttpBody.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `bodyKind` | `readonly` | `"single"` | - | - |
| `containsMetadataAnnotations` | `readonly` | `boolean` | If the body contains metadata annotations to ignore. For example `@header`. | [`HttpBody`](HttpBody.md).`containsMetadataAnnotations` |
| `contentTypeProperty?` | `readonly` | `ModelProperty` | Property used to set the content type if exists | [`HttpOperationBodyBase`](HttpOperationBodyBase.md).`contentTypeProperty` |
| `contentTypes` | `readonly` | `string`[] | Content types. | [`HttpOperationBodyBase`](HttpOperationBodyBase.md).`contentTypes` |
| `isExplicit` | `readonly` | `boolean` | If the body was explicitly set with `@body`. | [`HttpBody`](HttpBody.md).`isExplicit` |
| ~~`parameter?`~~ | `public` | `ModelProperty` | <p>**Deprecated**</p><p>use [property](HttpBody.md)</p> | [`HttpBody`](HttpBody.md).`parameter` |
| `property?` | `readonly` | `ModelProperty` | If the body was explicitly set as a property. Correspond to the property with `@body` or `@bodyRoot` | [`HttpBody`](HttpBody.md).`property` |
| `type` | `readonly` | `Type` | - | [`HttpBody`](HttpBody.md).`type` |
