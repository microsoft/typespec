---
jsApi: true
title: "[I] DecoratorValidator"

---
## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* [`TypeKind`](Type.TypeKind.md) | - |
| `P` *extends* *readonly* [`DecoratorParamDefinition`](Interface.DecoratorParamDefinition.md)< [`TypeKind`](Type.TypeKind.md) \>[] | - |
| `S` *extends* [`DecoratorParamDefinition`](Interface.DecoratorParamDefinition.md)< [`TypeKind`](Type.TypeKind.md) \> \| `undefined` | `undefined` |

## Methods

### validate

```ts
validate(
  context,
  target,
  parameters): boolean
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) |
| `target` | [`InferredTypeSpecValue`](Type.InferredTypeSpecValue.md)< `T` \> |
| `parameters` | `InferParameters`< `P`, `S` \> |

#### Returns

`boolean`
