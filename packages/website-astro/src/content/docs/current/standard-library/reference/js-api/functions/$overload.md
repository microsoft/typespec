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
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Operation`](../interfaces/Operation.md) | The specializing operation declaration |
| `overloadBase` | [`Operation`](../interfaces/Operation.md) | The operation to be overloaded. |
