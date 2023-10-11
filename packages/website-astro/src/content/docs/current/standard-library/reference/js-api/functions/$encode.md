---
jsApi: true
title: "[F] $encode"

---
```ts
$encode(
   context, 
   target, 
   encoding, 
   encodeAs?): void
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `encoding` | `string` \| [`EnumMember`](../interfaces/EnumMember.md) |
| `encodeAs`? | [`Scalar`](../interfaces/Scalar.md) |
