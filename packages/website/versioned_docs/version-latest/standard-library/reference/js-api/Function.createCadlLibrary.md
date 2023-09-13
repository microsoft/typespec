---
jsApi: true
title: "[F] createCadlLibrary"

---
```ts
createCadlLibrary<T, E>(lib): TypeSpecLibrary< T, E >
```

## Type parameters

| Parameter |
| :------ |
| `T` *extends* \{} |
| `E` *extends* `Record`< `string`, `any` \> |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `lib` | `Readonly`< [`TypeSpecLibraryDef`](Interface.TypeSpecLibraryDef.md)< `T`, `E` \> \> |

## Returns

[`TypeSpecLibrary`](Interface.TypeSpecLibrary.md)< `T`, `E` \>

## Deprecated

use createTypeSpecLibrary
