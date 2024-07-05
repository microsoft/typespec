---
jsApi: true
title: "[I] HttpOperationMultipartBody"

---
Body marked with `@multipartBody`

## Extends

- [`HttpOperationBodyBase`](HttpOperationBodyBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `bodyKind` | `readonly` | `"multipart"` | - | - |
| `contentTypeProperty?` | `readonly` | `ModelProperty` | Property used to set the content type if exists | [`HttpOperationBodyBase`](HttpOperationBodyBase.md).`contentTypeProperty` |
| `contentTypes` | `readonly` | `string`[] | Content types. | [`HttpOperationBodyBase`](HttpOperationBodyBase.md).`contentTypes` |
| `parts` | `readonly` | [`HttpOperationPart`](HttpOperationPart.md)[] | - | - |
| `property` | `readonly` | `ModelProperty` | Property annotated with `@multipartBody` | - |
| `type` | `readonly` | `Model` \| `Tuple` | - | - |
