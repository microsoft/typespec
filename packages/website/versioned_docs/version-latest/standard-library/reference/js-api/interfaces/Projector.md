---
jsApi: true
title: "[I] Projector"

---
## Properties

| Property | Type |
| :------ | :------ |
| `parentProjector?` | [`Projector`](Projector.md) |
| `projectedGlobalNamespace?` | [`Namespace`](Namespace.md) |
| `projectedStartNode?` | [`Type`](../type-aliases/Type.md) |
| `projectedTypes` | `Map`<[`Type`](../type-aliases/Type.md), [`Type`](../type-aliases/Type.md)\> |
| `projections` | [`ProjectionApplication`](ProjectionApplication.md)[] |

## Methods

### projectType()

```ts
projectType(type): Type | Value
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) |

#### Returns

[`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md)
