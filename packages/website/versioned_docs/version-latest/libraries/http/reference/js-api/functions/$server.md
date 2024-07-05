---
jsApi: true
title: "[F] $server"

---
```ts
function $server(
   context, 
   target, 
   url, 
   description, 
   parameters?): void
```

Configure the server url for the service.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | Decorator context |
| `target` | `Namespace` | Decorator target (must be a namespace) |
| `url` | `string` | - |
| `description` | `string` | Description for this server. |
| `parameters`? | `Type` |  |

## Returns

`void`

## Optional

Parameters to interpolate in the server url.
