---
jsApi: true
title: "[I] DecoratorValidator"

---
## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends [`TypeKind`](../type-aliases/TypeKind.md) | - |
| `P` extends readonly [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\>[] | - |
| `S` extends [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\> \| `undefined` | `undefined` |

## Methods

### validate()

```ts
validate(
   context, 
   target, 
   parameters): boolean
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](DecoratorContext.md) |
| `target` | [`InferredTypeSpecValue`](../type-aliases/InferredTypeSpecValue.md)<`T`\> |
| `parameters` | `InferParameters`<`P`, `S`\> |
