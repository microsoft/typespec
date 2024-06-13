---
jsApi: true
title: "[I] VoidType"

---
## Extends

- [`IntrinsicType`](IntrinsicType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `entityKind` | `readonly` | `"Type"` | - | [`IntrinsicType`](IntrinsicType.md).`entityKind` | [`IntrinsicType`](IntrinsicType.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | [`IntrinsicType`](IntrinsicType.md).`instantiationParameters` | [`IntrinsicType`](IntrinsicType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | <p>Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished:</p><ul><li>a template declaration will not</li><li>a template instance that argument that are still template parameters</li><li>a template instance that is only partially instantiated(like a templated operation inside a templated interface)</li></ul> | [`IntrinsicType`](IntrinsicType.md).`isFinished` | [`IntrinsicType`](IntrinsicType.md).`isFinished` |
| `kind` | `public` | `"Intrinsic"` | - | [`IntrinsicType`](IntrinsicType.md).`kind` | [`IntrinsicType`](IntrinsicType.md).`kind` |
| `name` | `public` | `"void"` | - | [`IntrinsicType`](IntrinsicType.md).`name` | [`IntrinsicType`](IntrinsicType.md).`name` |
| `node?` | `public` | [`Node`](../type-aliases/Node.md) | - | [`IntrinsicType`](IntrinsicType.md).`node` | [`IntrinsicType`](IntrinsicType.md).`node` |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`IntrinsicType`](IntrinsicType.md).`projectionBase` | [`IntrinsicType`](IntrinsicType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`IntrinsicType`](IntrinsicType.md).`projectionSource` | [`IntrinsicType`](IntrinsicType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | [`IntrinsicType`](IntrinsicType.md).`projector` | [`IntrinsicType`](IntrinsicType.md).`projector` |

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

[`IntrinsicType`](IntrinsicType.md).[`projectionsByName`](IntrinsicType.md#projectionsbyname)
