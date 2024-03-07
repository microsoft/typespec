---
jsApi: true
title: "[F] $error"

---
```ts
$error(context, entity): void
```

`@error` decorator marks a model as an error type.
 Any derived models (using extends) will also be seen as error types.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `entity` | [`Model`](../interfaces/Model.md) |

## Returns

`void`
