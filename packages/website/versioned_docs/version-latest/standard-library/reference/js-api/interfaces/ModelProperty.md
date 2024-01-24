---
jsApi: true
title: "[I] ModelProperty"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `default?` | [`Type`](../type-aliases/Type.md) | - | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `kind` | `"ModelProperty"` | - | [`BaseType.kind`](BaseType.md) |
| `model?` | [`Model`](Model.md) | - | - |
| `name` | `string` | - | - |
| `node` | [`ModelPropertyNode`](ModelPropertyNode.md) \| [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md) \| [`ProjectionModelPropertyNode`](ProjectionModelPropertyNode.md) \| [`ProjectionModelSpreadPropertyNode`](ProjectionModelSpreadPropertyNode.md) | - | [`BaseType.node`](BaseType.md) |
| `optional` | `boolean` | - | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
| `sourceProperty?` | [`ModelProperty`](ModelProperty.md) | - | - |
| `type` | [`Type`](../type-aliases/Type.md) | - | - |

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

[`BaseType.projectionsByName`](BaseType.md#projectionsbyname)
