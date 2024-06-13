---
jsApi: true
title: "[I] MetadataInfoOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `canonicalVisibility?` | [`Visibility`](../enumerations/Visibility.md) | <p>The visibility to be used as the baseline against which</p><p>[MetadataInfo.isEmptied](MetadataInfo.md#isemptied) and [MetadataInfo.isTransformed](MetadataInfo.md#istransformed) are computed. If not specified, [Visibility.None](../enumerations/Visibility.md) is used, which will consider that any model that has fields that are only visible to some visibilities as transformed.</p> |

## Methods

### canShareProperty()?

```ts
optional canShareProperty(property): boolean
```

Optional callback to indicate that a property can be shared with the
canonical representation even for visibilities where it is not visible.

This is used, for example, in OpenAPI emit where a property can be
marked `readOnly: true` to represent @visibility("read") without
creating a separate schema schema for [Visibility.Read](../enumerations/Visibility.md).

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`boolean`
