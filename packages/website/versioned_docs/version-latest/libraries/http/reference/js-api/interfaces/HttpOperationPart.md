---
jsApi: true
title: "[I] HttpOperationPart"

---
Represent an part in a multipart body.

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `body` | `readonly` | [`HttpOperationBody`](HttpOperationBody.md) | Part body |
| `filename?` | `readonly` | `ModelProperty` | If the Part is an HttpFile this is the property defining the filename |
| `headers` | `readonly` | `HeaderProperty`[] | Part headers |
| `multi` | `readonly` | `boolean` | If there can be multiple of that part |
| `name?` | `readonly` | `string` | Part name |
| `optional` | `readonly` | `boolean` | If the part is optional |
