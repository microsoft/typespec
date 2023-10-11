---
jsApi: true
title: "[I] DecoratorDefinition"

---
## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends [`TypeKind`](../type-aliases/TypeKind.md) | - |
| `P` extends readonly [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\>[] | - |
| `S` extends [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\> \| `undefined` | `undefined` |

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `args` | `P` | List of positional arguments in the function. |
| `readonly` | `name` | `string` | Name of the decorator. |
| `readonly` | `spreadArgs?` | `S` | **Optional**<br /><br />Type of the spread args at the end of the function if applicable. |
| `readonly` | `target` | `T` \| readonly `T`[] | Decorator target. |
