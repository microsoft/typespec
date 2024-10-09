---
jsApi: true
title: "[F] createCadlLibrary"

---
```ts
function createCadlLibrary<T, E, State>(lib): TypeSpecLibrary<T, E, State>
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `object` | - |
| `E` *extends* `Record`<`string`, `any`\> | - |
| `State` *extends* `string` | `never` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lib` | `Readonly`<[`TypeSpecLibraryDef`](../interfaces/TypeSpecLibraryDef.md)<`T`, `E`, `State`\>\> | Library definition. |

## Returns

[`TypeSpecLibrary`](../interfaces/TypeSpecLibrary.md)<`T`, `E`, `State`\>

Library with utility functions.

## Deprecated

use createTypeSpecLibrary

## Tutorial

Create the lib object with `as const` to get the full typing.

## Example

```ts
const libDef = {
  name: "myLib",
  diagnostics: {
   "my-code": {serverity: "error", messages: {default: "Foo bar"}}
  },
} as const;

const lib = createTypeSpecLibrary(libDef);
```
