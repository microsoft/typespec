---
jsApi: true
title: "[I] ErrorType"

---
## Extends

- [`IntrinsicType`](Interface.IntrinsicType.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Intrinsic"` | - |
| `name` | `"ErrorType"` | - |
| `node`? | [`Node`](Type.Node.md) | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Inherited from

[`IntrinsicType`](Interface.IntrinsicType.md).[`projections`](Interface.IntrinsicType.md#projections)

## Methods

### projectionsByName

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](Interface.ProjectionStatementNode.md)[]

#### Inherited from

[`IntrinsicType`](Interface.IntrinsicType.md).[`projectionsByName`](Interface.IntrinsicType.md#projectionsbyname)
