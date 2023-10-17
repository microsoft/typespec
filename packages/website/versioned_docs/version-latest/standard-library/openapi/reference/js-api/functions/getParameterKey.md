---
jsApi: true
title: "[F] getParameterKey"

---
```ts
getParameterKey(
   program, 
   property, 
   newParam, 
   existingParams, 
   options): string
```

Gets the key that is used to define a parameter in OpenAPI.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |
| `newParam` | `unknown` |
| `existingParams` | `Record`<`string`, `unknown`\> |
| `options` | `TypeNameOptions` |
