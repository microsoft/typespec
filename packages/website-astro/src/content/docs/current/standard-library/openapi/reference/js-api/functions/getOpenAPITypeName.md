---
jsApi: true
title: "[F] getOpenAPITypeName"

---
```ts
getOpenAPITypeName(
   program, 
   type, 
   options, 
   existing?): string
```

Gets the name of a type to be used in OpenAPI.

For inlined types: this is the TypeSpec-native name written to `x-typespec-name`.

For non-inlined types: this is either the friendly name or the TypeSpec-native name.

TypeSpec-native names are shortened to exclude root `TypeSpec` namespace and service
namespace using the provided `TypeNameOptions`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |
| `options` | `TypeNameOptions` |
| `existing`? | `Record`<`string`, `any`\> |
