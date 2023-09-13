---
jsApi: true
title: "[I] ModelProperty"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `default`? | [`Type`](Type.Type.md) | - |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"ModelProperty"` | - |
| `model`? | [`Model`](Interface.Model.md) | - |
| `name` | `string` | - |
| `node` | [`ModelPropertyNode`](Interface.ModelPropertyNode.md) \| [`ModelSpreadPropertyNode`](Interface.ModelSpreadPropertyNode.md) \| [`ProjectionModelPropertyNode`](Interface.ProjectionModelPropertyNode.md) \| [`ProjectionModelSpreadPropertyNode`](Interface.ProjectionModelSpreadPropertyNode.md) | - |
| `optional` | `boolean` | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `sourceProperty`? | [`ModelProperty`](Interface.ModelProperty.md) | - |
| `type` | [`Type`](Type.Type.md) | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Inherited from

[`BaseType`](Interface.BaseType.md).[`projections`](Interface.BaseType.md#projections)

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

[`BaseType`](Interface.BaseType.md).[`projectionsByName`](Interface.BaseType.md#projectionsbyname)
