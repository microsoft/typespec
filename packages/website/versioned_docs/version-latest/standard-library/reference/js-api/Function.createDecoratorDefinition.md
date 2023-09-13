---
jsApi: true
title: "[F] createDecoratorDefinition"

---
```ts
createDecoratorDefinition<T, P, S>(definition): DecoratorValidator< T, P, S >
```

## Type parameters

| Parameter |
| :------ |
| `T` *extends* [`TypeKind`](Type.TypeKind.md) |
| `P` *extends* *readonly* [`DecoratorParamDefinition`](Interface.DecoratorParamDefinition.md)< [`TypeKind`](Type.TypeKind.md) \>[] |
| `S` *extends* `undefined` \| [`DecoratorParamDefinition`](Interface.DecoratorParamDefinition.md)< [`TypeKind`](Type.TypeKind.md) \> |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `definition` | [`DecoratorDefinition`](Interface.DecoratorDefinition.md)< `T`, `P`, `S` \> |

## Returns

[`DecoratorValidator`](Interface.DecoratorValidator.md)< `T`, `P`, `S` \>

## Deprecated

use extern dec definition in typespec instead.
