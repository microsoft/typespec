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

## Optional

Parameters to interpolate in the server url.

## Parameters

| Parameter     | Type               | Description                           |
| :------------ | :----------------- | :------------------------------------ |
| `context`     | `DecoratorContext` | Decorator context                     |
| `target`      | `Namespace`        | Decorator target(Must be a namespace) |
| `url`         | `string`           | -                                     |
| `description` | `string`           | Description for this server.          |
| `parameters`? | `Model`            |                                       |

## Returns

`void`

## Source

[decorators.ts:358](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/decorators.ts#L358)
