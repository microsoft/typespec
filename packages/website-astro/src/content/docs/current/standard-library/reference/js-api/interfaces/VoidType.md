---
jsApi: true
title: "[I] VoidType"

---
## Extends

- [`IntrinsicType`](IntrinsicType.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`IntrinsicType`](IntrinsicType.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`IntrinsicType`](IntrinsicType.md).`isFinished` |
| `kind` | `"Intrinsic"` | - | [`IntrinsicType`](IntrinsicType.md).`kind` |
| `name` | `"void"` | - | [`IntrinsicType`](IntrinsicType.md).`name` |
| `node?` | [`Node`](../type-aliases/Node.md) | - | [`IntrinsicType`](IntrinsicType.md).`node` |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`IntrinsicType`](IntrinsicType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`IntrinsicType`](IntrinsicType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`IntrinsicType`](IntrinsicType.md).`projector` |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Inherited from

[`IntrinsicType`](IntrinsicType.md).[`projectionsByName`](IntrinsicType.md#projectionsbyname)
