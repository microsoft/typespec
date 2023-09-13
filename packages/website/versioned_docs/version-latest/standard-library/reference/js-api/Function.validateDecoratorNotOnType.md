---
jsApi: true
title: "[F] validateDecoratorNotOnType"

---
```ts
validateDecoratorNotOnType(
  context,
  type,
  badDecorator,
  givenDecorator): boolean
```

Validate that a given decorator is not on a type or any of its base types.
Useful to check for decorator usage that conflicts with another decorator.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) | Decorator context |
| `type` | [`Type`](Type.Type.md) | The type to check |
| `badDecorator` | [`DecoratorFunction`](Interface.DecoratorFunction.md) | The decorator we don't want present |
| `givenDecorator` | [`DecoratorFunction`](Interface.DecoratorFunction.md) | The decorator that is the reason why we don't want the bad decorator present |

## Returns

`boolean`

Whether the decorator application is valid
