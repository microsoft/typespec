---
jsApi: true
title: "[F] $overload"

---
```ts
function $overload(
   context, 
   target, 
   overloadbase): void
```

`@overload` - Indicate that the target overloads (specializes) the overloads type.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Operation`](../interfaces/Operation.md) | The specializing operation declaration |
| `overloadbase` | [`Operation`](../interfaces/Operation.md) | - |

## Returns

`void`
