---
jsApi: true
title: "[F] isCadlValueTypeOf"

---
```ts
function isCadlValueTypeOf<K>(target, expectedType): target is InferredTypeSpecValue<K>
```

Check if the given target is of any of the TypeSpec types.

## Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* [`TypeKind`](../type-aliases/TypeKind.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`TypeSpecValue`](../type-aliases/TypeSpecValue.md) | Target to validate. |
| `expectedType` | `K` \| readonly `K`[] | One or multiple allowed TypeSpec types. |

## Returns

`target is InferredTypeSpecValue<K>`

boolean if the target is of one of the allowed types.
