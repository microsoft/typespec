---
jsApi: true
title: "[F] getVisibilitySuffix"

---
```ts
getVisibilitySuffix(visibility, canonicalVisibility): string
```

Provides a naming suffix to create a unique name for a type with this
visibility.

The canonical visibility (default Visibility.Read) gets empty suffix,
otherwise visibilities are joined in pascal-case with `Or`. And `Item` is
if `Visibility.Item` is produced.

Examples (with canonicalVisibility = Visibility.Read):
 - Visibility.Read => ""
 - Visibility.Update => "Update"
 - Visibility.Create | Visibility.Update => "CreateOrUpdate"
 - Visibility.Create | Visibility.Item => "CreateItem"
 - Visibility.Create | Visibility.Update | Visibility.Item => "CreateOrUpdateItem"

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `visibility` | [`Visibility`](../enumerations/Visibility.md) | `undefined` |
| `canonicalVisibility` | `undefined` \| [`Visibility`](../enumerations/Visibility.md) | `Visibility.None` |
