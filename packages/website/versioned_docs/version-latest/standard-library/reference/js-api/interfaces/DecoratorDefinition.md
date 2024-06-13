---
jsApi: true
title: "[I] DecoratorDefinition"

---
## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` *extends* [`TypeKind`](../type-aliases/TypeKind.md) | - |
| `P` *extends* readonly [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\>[] | - |
| `S` *extends* [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\> \| `undefined` | `undefined` |

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `args` | `readonly` | `P` | List of positional arguments in the function. |
| `name` | `readonly` | `string` | Name of the decorator. |
| `spreadArgs?` | `readonly` | `S` | <p>**Optional**</p><p>Type of the spread args at the end of the function if applicable.</p> |
| `target` | `readonly` | `T` \| readonly `T`[] | Decorator target. |
