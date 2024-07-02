---
jsApi: true
title: "[F] getOverriddenProperty"

---
```ts
function getOverriddenProperty(property): ModelProperty | undefined
```

Gets the property from the nearest base type that is overridden by the
given property, if any.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `property` | [`ModelProperty`](../interfaces/ModelProperty.md) |

## Returns

[`ModelProperty`](../interfaces/ModelProperty.md) \| `undefined`
