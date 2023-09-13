---
jsApi: true
title: "[F] isCadlValueTypeOf"

---
```ts
isCadlValueTypeOf<K>(target, expectedType): target is InferredTypeSpecValue<K>
```

## Type parameters

| Parameter |
| :------ |
| `K` *extends* [`TypeKind`](Type.TypeKind.md) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`TypeSpecValue`](Type.TypeSpecValue.md) |
| `expectedType` | `K` \| *readonly* `K`[] |

## Returns

`target is InferredTypeSpecValue<K>`

## Deprecated

use isTypeSpecValueTypeOf
