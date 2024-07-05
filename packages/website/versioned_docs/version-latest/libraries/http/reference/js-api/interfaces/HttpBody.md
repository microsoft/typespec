---
jsApi: true
title: "[I] HttpBody"

---
## Extended by

- [`HttpOperationBody`](HttpOperationBody.md)

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `containsMetadataAnnotations` | `readonly` | `boolean` | If the body contains metadata annotations to ignore. For example `@header`. |
| `isExplicit` | `readonly` | `boolean` | If the body was explicitly set with `@body`. |
| ~~`parameter?`~~ | `public` | `ModelProperty` | <p>**Deprecated**</p><p>use [property](HttpBody.md)</p> |
| `property?` | `readonly` | `ModelProperty` | If the body was explicitly set as a property. Correspond to the property with `@body` or `@bodyRoot` |
| `type` | `readonly` | `Type` | - |
