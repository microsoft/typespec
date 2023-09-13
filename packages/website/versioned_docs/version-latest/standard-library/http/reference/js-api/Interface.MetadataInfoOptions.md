---
jsApi: true
title: "[I] MetadataInfoOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `canonicalVisibility`? | [`Visibility`](Enumeration.Visibility.md) | The visibility to be used as the baseline against which<br />[isEmptied](Interface.MetadataInfo.md#isemptied) and [isTransformed](Interface.MetadataInfo.md#istransformed)<br />are computed. If not specified, [None](Enumeration.Visibility.md#none) is used, which<br />will consider that any model that has fields that are only visible to<br />some visibilities as transformed. |

## Methods

### canShareProperty

```ts
optional canShareProperty(property): boolean
```

Optional callback to indicate that a property can be shared with the
canonical representation even for visibilities where it is not visible.

This is used, for example, in OpenAPI emit where a property can be
marked `readOnly: true` to represent @visibility("read") without
creating a separate schema schema for [Read](Enumeration.Visibility.md#read).

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`boolean`
