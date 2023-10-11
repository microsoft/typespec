---
jsApi: true
title: "[I] Projector"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `parentProjector?` | [`Projector`](Projector.md) | - |
| `projectedGlobalNamespace?` | [`Namespace`](Namespace.md) | - |
| `projectedStartNode?` | [`Type`](../type-aliases/Type.md) | - |
| `projectedTypes` | `Map`<[`Type`](../type-aliases/Type.md), [`Type`](../type-aliases/Type.md)\> | - |
| `projections` | [`ProjectionApplication`](ProjectionApplication.md)[] | - |

## Methods

### projectType()

```ts
projectType(type): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) |
