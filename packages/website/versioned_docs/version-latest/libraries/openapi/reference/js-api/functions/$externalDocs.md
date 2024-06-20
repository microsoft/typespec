---
jsApi: true
title: "[F] $externalDocs"

---
```ts
function $externalDocs(
   context, 
   target, 
   url, 
   description?): void
```

Allows referencing an external resource for extended documentation.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | - |
| `target` | `Type` | - |
| `url` | `string` | The URL for the target documentation. Value MUST be in the format of a URL. |
| `description`? | `string` | A short description of the target documentation. |

## Returns

`void`
