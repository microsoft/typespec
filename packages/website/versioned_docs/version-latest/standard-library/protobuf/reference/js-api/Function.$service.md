---
jsApi: true
title: "[F] $service"
---

```ts
$service(ctx, target): void
```

Decorate an interface as a service, indicating that it represents a Protobuf `service` declaration.

## Parameters

| Parameter | Type               | Description             |
| :-------- | :----------------- | :---------------------- |
| `ctx`     | `DecoratorContext` | decorator context       |
| `target`  | `Interface`        | the decorated interface |

## Returns

`void`

## Source

[proto.ts:56](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/protobuf/src/proto.ts#L56)
