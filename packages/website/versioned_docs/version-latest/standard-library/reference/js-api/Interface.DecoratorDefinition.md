---
jsApi: true
title: "[I] DecoratorDefinition"

---
## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* [`TypeKind`](Type.TypeKind.md) | - |
| `P` *extends* *readonly* [`DecoratorParamDefinition`](Interface.DecoratorParamDefinition.md)< [`TypeKind`](Type.TypeKind.md) \>[] | - |
| `S` *extends* [`DecoratorParamDefinition`](Interface.DecoratorParamDefinition.md)< [`TypeKind`](Type.TypeKind.md) \> \| `undefined` | `undefined` |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `args` | `P` | List of positional arguments in the function. |
| `readonly` `name` | `string` | Name of the decorator. |
| `spreadArgs`? | `S` | **Optional**<br /><br />Type of the spread args at the end of the function if applicable. |
| `readonly` `target` | `T` \| *readonly* `T`[] | Decorator target. |
