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
| `type` | [`Type`](Type.Type.md) | Type to navigate. |
| `listeners` | [`SemanticNodeListener`](Type.SemanticNodeListener.md) | Listener for the types found. |
| `options` | [`NavigationOptions`](Interface.NavigationOptions.md) | Navigation options |

## Returns

`void`
