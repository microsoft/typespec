---
jsApi: true
title: "[I] Projector"

---
## Properties

| Property | Type |
| :------ | :------ |
| `parentProjector`? | [`Projector`](Interface.Projector.md) |
| `projectedGlobalNamespace`? | [`Namespace`](Interface.Namespace.md) |
| `projectedStartNode`? | [`Type`](Type.Type.md) |
| `projectedTypes` | `Map`< [`Type`](Type.Type.md), [`Type`](Type.Type.md) \> |
| `projections` | [`ProjectionApplication`](Interface.ProjectionApplication.md)[] |

## Methods

### projectType

```ts
projectType(type): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](Type.Type.md) |

#### Returns

[`Type`](Type.Type.md)
