---
jsApi: true
title: "[F] createDecoratorDefinition"

---
```ts
function createDecoratorDefinition<T, P, S>(definition): DecoratorValidator<T, P, S>
```

## Type parameters

| Type parameter |
| :------ |
| `T` *extends* [`TypeKind`](../type-aliases/TypeKind.md) |
| `P` *extends* readonly [`DecoratorParamDefinition`](../interfaces/DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\>[] |
| `S` *extends* `undefined` \| [`DecoratorParamDefinition`](../interfaces/DecoratorParamDefinition.md)<[`TypeKind`](../type-aliases/TypeKind.md)\> |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `definition` | [`DecoratorDefinition`](../interfaces/DecoratorDefinition.md)<`T`, `P`, `S`\> |

## Returns

[`DecoratorValidator`](../interfaces/DecoratorValidator.md)<`T`, `P`, `S`\>

## Deprecated

use extern dec definition in TypeSpec instead.
