---
jsApi: true
title: "[F] validateDecoratorTarget"

---
```ts
validateDecoratorTarget<K>(
   context, 
   target, 
   decoratorName, 
   expectedType): target is K extends "Any" ? Type : Object
```

Validate the decorator target is matching the expected value.

## Type parameters

| Parameter |
| :------ |
| `K` extends [`TypeKind`](../type-aliases/TypeKind.md) |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | - |
| `target` | [`Type`](../type-aliases/Type.md) |  |
| `decoratorName` | `string` |  |
| `expectedType` | `K` \| readonly `K`[] |  |

## Returns
