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
| `target` | [`Scalar`](../interfaces/Scalar.md) \| [`ModelProperty`](../interfaces/ModelProperty.md) |
| `decoratorName` | `string` |
| `expectedType` | [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) \| [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md)[] |

## Returns

`boolean`

## Deprecated

this function is deprecated use decorator definition in TypeSpec instead or check assignability directly.
