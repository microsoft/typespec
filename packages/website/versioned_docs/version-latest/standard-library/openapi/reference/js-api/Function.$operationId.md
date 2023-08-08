---
jsApi: true
title: "[F] $operationId"
---

```ts
$operationId(
  context,
  entity,
  opId): void
```

Set a specific operation ID.

## Parameters

| Parameter | Type               | Description       |
| :-------- | :----------------- | :---------------- |
| `context` | `DecoratorContext` | Decorator Context |
| `entity`  | `Operation`        | Decorator target  |
| `opId`    | `string`           | Operation ID.     |

## Returns

`void`

## Source

[decorators.ts:24](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/openapi/src/decorators.ts#L24)
