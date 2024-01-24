---
jsApi: true
title: "[I] NullType"

---
## Extends

- [`IntrinsicType`](IntrinsicType.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`IntrinsicType.instantiationParameters`](IntrinsicType.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`IntrinsicType.isFinished`](IntrinsicType.md) |
| `kind` | `"Intrinsic"` | - | [`IntrinsicType.kind`](IntrinsicType.md) |
| `name` | `"null"` | - | [`IntrinsicType.name`](IntrinsicType.md) |
| `node?` | [`Node`](../type-aliases/Node.md) | - | [`IntrinsicType.node`](IntrinsicType.md) |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`IntrinsicType.projectionBase`](IntrinsicType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`IntrinsicType.projectionSource`](IntrinsicType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`IntrinsicType.projector`](IntrinsicType.md) |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`IntrinsicType.projectionsByName`](IntrinsicType.md#projectionsbyname)
