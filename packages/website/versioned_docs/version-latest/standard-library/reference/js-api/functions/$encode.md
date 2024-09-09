---
jsApi: true
title: "[F] $encode"

---
```ts
function $encode(
   context, 
   target, 
   encodingOrEncodeAs, 
   encodedAs?): void
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `encodingOrEncodeAs` | `string` \| [`Scalar`](../interfaces/Scalar.md) \| [`EnumValue`](../interfaces/EnumValue.md) |
| `encodedAs`? | [`Scalar`](../interfaces/Scalar.md) |

## Returns

`void`
