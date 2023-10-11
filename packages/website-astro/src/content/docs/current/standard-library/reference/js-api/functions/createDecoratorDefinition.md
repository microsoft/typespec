---
jsApi: true
title: "[F] createDecoratorDefinition"

---
```ts
createDecoratorDefinition<T, P, S>(definition): DecoratorValidator<T, P, S>
```

## Type parameters

| Parameter |
| :------ |
| `T` extends [`TypeKind`](../type-aliases/TypeKind.md) |
| `P` extends readonly [`DecoratorParamDefinition`](../interfaces/DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\>[] |
| `S` extends `undefined` \| [`DecoratorParamDefinition`](../interfaces/DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\> |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `definition` | [`DecoratorDefinition`](../interfaces/DecoratorDefinition.md)<`T`, `P`, `S`\> |

## Returns

## Deprecated

use extern dec definition in typespec instead.
