---
jsApi: true
title: "[F] createTypeSpecLibrary"

---
```ts
createTypeSpecLibrary<T, E>(lib): TypeSpecLibrary<T, E>
```

Create a new TypeSpec library definition.

## Type parameters

| Parameter |
| :------ |
| `T` extends `object` |
| `E` extends `Record`<`string`, `any`\> |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `lib` | `Readonly`<[`TypeSpecLibraryDef`](../interfaces/TypeSpecLibraryDef.md)<`T`, `E`\>\> | Library definition. |

## Returns

Library with utility functions.

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
