---
jsApi: true
title: "[I] DecoratorDefinition"

---
## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`TypeKind`](../type-aliases/TypeKind.md) | - |
| `P` *extends* readonly [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\>[] | - |
| `S` *extends* [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\> \| `undefined` | `undefined` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `args` | `readonly` | `P` | List of positional arguments in the function. |
| `name` | `readonly` | `string` | Name of the decorator. |
| `spreadArgs?` | `readonly` | `S` | **Optional** Type of the spread args at the end of the function if applicable. |
| `target` | `readonly` | `T` \| readonly `T`[] | Decorator target. |
