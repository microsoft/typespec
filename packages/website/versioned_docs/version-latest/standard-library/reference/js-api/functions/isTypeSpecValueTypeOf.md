---
jsApi: true
title: "[F] isTypeSpecValueTypeOf"

---
```ts
isTypeSpecValueTypeOf<K>(target, expectedType): target is InferredTypeSpecValue<K>
```

Check if the given target is of any of the typespec types.

## Type parameters

| Parameter |
| :------ |
| `K` extends [`TypeKind`](../type-aliases/TypeKind.md) |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `target` | [`TypeSpecValue`](../type-aliases/TypeSpecValue.md) | Target to validate. |
| `expectedType` | `K` \| readonly `K`[] | One or multiple allowed typespec types. |

## Returns

boolean if the target is of one of the allowed types.
