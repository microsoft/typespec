---
jsApi: true
title: "[F] getDiscriminatedUnion"

---
```ts
function getDiscriminatedUnion(type, discriminator): [DiscriminatedUnion, readonly Diagnostic[]]
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Model`](../interfaces/Model.md) \| [`Union`](../interfaces/Union.md) |
| `discriminator` | [`Discriminator`](../interfaces/Discriminator.md) |

## Returns

[[`DiscriminatedUnion`](../interfaces/DiscriminatedUnion.md), readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]]
