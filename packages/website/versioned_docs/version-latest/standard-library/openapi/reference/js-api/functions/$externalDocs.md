---
jsApi: true
title: "[F] $externalDocs"

---
```ts
$externalDocs(
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
| `description`? | `string` | - |

## Returns

## Optional

description A short description of the target documentation.
