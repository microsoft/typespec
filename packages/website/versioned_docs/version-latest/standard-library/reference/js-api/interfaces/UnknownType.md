---
jsApi: true
title: "[I] UnknownType"

---
## Extends

- [`IntrinsicType`](IntrinsicType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `entityKind` | `readonly` | `"Type"` | - | - | [`IntrinsicType`](IntrinsicType.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`IntrinsicType`](IntrinsicType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`IntrinsicType`](IntrinsicType.md).`isFinished` |
| `kind` | `public` | `"Intrinsic"` | - | - | [`IntrinsicType`](IntrinsicType.md).`kind` |
| `name` | `public` | `"unknown"` | - | [`IntrinsicType`](IntrinsicType.md).`name` | - |
| `node?` | `public` | [`Node`](../type-aliases/Node.md) | - | - | [`IntrinsicType`](IntrinsicType.md).`node` |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`IntrinsicType`](IntrinsicType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`IntrinsicType`](IntrinsicType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`IntrinsicType`](IntrinsicType.md).`projector` |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`IntrinsicType`](IntrinsicType.md).[`projections`](IntrinsicType.md#projections)

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`IntrinsicType`](IntrinsicType.md).[`projectionsByName`](IntrinsicType.md#projectionsbyname)
