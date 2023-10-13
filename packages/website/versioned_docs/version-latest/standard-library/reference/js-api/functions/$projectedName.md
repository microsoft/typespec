---
jsApi: true
title: "[F] $projectedName"

---
```ts
$projectedName(
   context, 
   target, 
   projectionName, 
   projectedName): void
```

`@projectedName` - Indicate that this entity should be renamed according to the given projection.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Type`](../type-aliases/Type.md) | The that should have a different name. |
| `projectionName` | `string` | Name of the projection (e.g. "toJson", "toCSharp") |
| `projectedName` | `string` | Name of the type should have in the scope of the projection specified. |
