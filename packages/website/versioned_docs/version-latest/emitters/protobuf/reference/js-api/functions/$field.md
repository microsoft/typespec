---
jsApi: true
title: "[F] $field"

---
```ts
function $field(
   context, 
   target, 
   index): void
```

Decorate a model property with a field index. Field indices are required for all fields of emitted messages.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `target` | `ModelProperty` |  |
| `index` | `number` | - |

## Returns

`void`
