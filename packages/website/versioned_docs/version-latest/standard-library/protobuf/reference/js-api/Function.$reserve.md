---
jsApi: true
title: "[F] $reserve"
---

```ts
$reserve(
  ctx,
  target,
  ...reservations): void
```

## Parameters

| Parameter         | Type                                          |
| :---------------- | :-------------------------------------------- |
| `ctx`             | `DecoratorContext`                            |
| `target`          | `Model`                                       |
| ...`reservations` | _readonly_ (`string` \| `number` \| `Type`)[] |

## Returns

`void`

## Source

[proto.ts:133](https://github.com/markcowl/cadl/blob/3db15286/packages/protobuf/src/proto.ts#L133)
