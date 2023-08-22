---
jsApi: true
title: "[F] $field"
---

```ts
$field(
  ctx,
  target,
  fieldIndex): void
```

Decorate a model property with a field index. Field indices are required for all fields of emitted messages.

## Parameters

| Parameter    | Type               | Description |
| :----------- | :----------------- | :---------- |
| `ctx`        | `DecoratorContext` | -           |
| `target`     | `ModelProperty`    |             |
| `fieldIndex` | `number`           |             |

## Returns

`void`

## Source

[proto.ts:159](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/protobuf/src/proto.ts#L159)
