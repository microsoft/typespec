---
jsApi: true
title: "[F] $error"

---
```ts
function $error(context, target): void
```

`@error` decorator marks a model as an error type.
 Any derived models (using extends) will also be seen as error types.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) |

## Returns

`void`
