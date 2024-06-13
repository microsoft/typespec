---
jsApi: true
title: "[F] isCadlValueTypeOf"

---
```ts
function isCadlValueTypeOf<K>(target, expectedType): target is InferredTypeSpecValue<K>
```

## Type parameters

| Type parameter |
| :------ |
| `K` *extends* [`TypeKind`](../type-aliases/TypeKind.md) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`TypeSpecValue`](../type-aliases/TypeSpecValue.md) |
| `expectedType` | `K` \| readonly `K`[] |

## Returns

`target is InferredTypeSpecValue<K>`

## Deprecated

use isTypeSpecValueTypeOf
