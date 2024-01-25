---
jsApi: true
title: "[F] createCadlLibrary"

---
```ts
createCadlLibrary<T, E, State>(lib): TypeSpecLibrary<T, E, State>
```

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `E` extends `Record`<`string`, `any`\> | - |
| `State` extends `string` | `never` |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `lib` | `Readonly`<[`TypeSpecLibraryDef`](../interfaces/TypeSpecLibraryDef.md)<`T`, `E`, `State`\>\> |

## Returns

[`TypeSpecLibrary`](../interfaces/TypeSpecLibrary.md)<`T`, `E`, `State`\>

## Deprecated

use createTypeSpecLibrary
