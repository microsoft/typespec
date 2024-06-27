---
jsApi: true
title: "[F] createCadlLibrary"

---
```ts
function createCadlLibrary<T, E, State>(lib): TypeSpecLibrary<T, E, State>
```

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` *extends* `object` | - |
| `E` *extends* `Record`<`string`, `any`\> | - |
| `State` *extends* `string` | `never` |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `lib` | `Readonly`<[`TypeSpecLibraryDef`](../interfaces/TypeSpecLibraryDef.md)<`T`, `E`, `State`\>\> |

## Returns

[`TypeSpecLibrary`](../interfaces/TypeSpecLibrary.md)<`T`, `E`, `State`\>

## Deprecated

use createTypeSpecLibrary
