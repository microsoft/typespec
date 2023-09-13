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
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) |
| `target` | [`ModelProperty`](Interface.ModelProperty.md) \| [`Scalar`](Interface.Scalar.md) |
| `decoratorName` | `string` |
| `expectedType` | [`IntrinsicScalarName`](Type.IntrinsicScalarName.md) \| [`IntrinsicScalarName`](Type.IntrinsicScalarName.md)[] |

## Returns

`boolean`
