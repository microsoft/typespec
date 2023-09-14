---
jsApi: true
title: "[F] walkPropertiesInherited"

---
```ts
walkPropertiesInherited(model): Generator< ModelProperty, void, unknown >
```

Enumerates the properties declared by model or inherited from its base.

Properties declared by more derived types are enumerated before properties
of less derived types.

Properties that are overridden are not enumerated.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`Model`](Interface.Model.md) |

## Returns

`Generator`< [`ModelProperty`](Interface.ModelProperty.md), `void`, `unknown` \>
