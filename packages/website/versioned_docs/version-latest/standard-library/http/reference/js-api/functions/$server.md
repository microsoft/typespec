---
jsApi: true
title: "[F] $server"

---
```ts
$server(
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
| `target` | `Namespace` | Decorator target(Must be a namespace) |
| `url` | `string` | - |
| `description` | `string` | Description for this server. |
| `parameters`? | `Model` |  |

## Returns

## Optional

Parameters to interpolate in the server url.
