---
jsApi: true
title: "[F] $overload"

---
```ts
$overload(
  context,
  target,
  overloadBase): void
```

`@overload` - Indicate that the target overloads (specializes) the overloads type.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) | DecoratorContext |
| `target` | [`Operation`](Interface.Operation.md) | The specializing operation declaration |
| `overloadBase` | [`Operation`](Interface.Operation.md) | The operation to be overloaded. |

## Returns

`void`
