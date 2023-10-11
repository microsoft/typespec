---
jsApi: true
title: "[F] navigateType"

---
```ts
navigateType(
   type, 
   listeners, 
   options): void
```

Navigate the given type and all the types that are used in it.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) | Type to navigate. |
| `listeners` | [`SemanticNodeListener`](../type-aliases/SemanticNodeListener.md) | Listener for the types found. |
| `options` | [`NavigationOptions`](../interfaces/NavigationOptions.md) | Navigation options |
