---
jsApi: true
title: "[F] $sharedRoute"
---

```ts
$sharedRoute(context, entity): void
```

`@sharedRoute` marks the operation as sharing a route path with other operations.

When an operation is marked with `@sharedRoute`, it enables other operations to share the same
route path as long as those operations are also marked with `@sharedRoute`.

`@sharedRoute` can only be applied directly to operations.

## Parameters

| Parameter | Type               |
| :-------- | :----------------- |
| `context` | `DecoratorContext` |
| `entity`  | `Operation`        |

## Returns

`void`

## Source

[decorators.ts:614](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/decorators.ts#L614)
