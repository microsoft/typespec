---
jsApi: true
title: "[F] validateDecoratorTargetIntrinsic"

---
```ts
validateDecoratorTargetIntrinsic(
   context, 
   target, 
   decoratorName, 
   expectedType): boolean
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `decoratorName` | `string` |
| `expectedType` | [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) \| [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md)[] |

## Returns

## Deprecated

this function is deprecated use decorator definition in typespec instead or check assignability directly.
