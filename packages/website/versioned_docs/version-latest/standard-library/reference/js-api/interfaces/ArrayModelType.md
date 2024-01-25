---
jsApi: true
title: "[I] ArrayModelType"

---
## Extends

- [`Model`](Model.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `baseModel?` | [`Model`](Model.md) | Model this model extends. This represent inheritance. | [`Model.baseModel`](Model.md) |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`Model.decorators`](Model.md) |
| `derivedModels` | [`Model`](Model.md)[] | Direct children. This is the reverse relation of [baseModel](ArrayModelType.md) | [`Model.derivedModels`](Model.md) |
| `indexer` | `Object` | - | [`Model.indexer`](Model.md) |
| `indexer.key` | [`Scalar`](Scalar.md) | - | - |
| `indexer.value` | [`Type`](../type-aliases/Type.md) | - | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`Model.instantiationParameters`](Model.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`Model.isFinished`](Model.md) |
| `kind` | `"Model"` | - | [`Model.kind`](Model.md) |
| `name` | `string` | - | [`Model.name`](Model.md) |
| `namespace?` | [`Namespace`](Namespace.md) | - | [`Model.namespace`](Model.md) |
| `node?` | [`ModelExpressionNode`](ModelExpressionNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ModelStatementNode`](ModelStatementNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md) | - | [`Model.node`](Model.md) |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`Model.projectionBase`](Model.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`Model.projectionSource`](Model.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`Model.projector`](Model.md) |
| `properties` | `RekeyableMap`<`string`, [`ModelProperty`](ModelProperty.md)\> | The properties of the model.<br /><br />Properties are ordered in the order that they appear in source.<br />Properties obtained via `model is` appear before properties defined in<br />the model body. Properties obtained via `...` are inserted where the<br />spread appears in source.<br /><br />Properties inherited via `model extends` are not included. Use<br />[walkPropertiesInherited](../functions/walkPropertiesInherited.md) to enumerate all properties in the<br />inheritance hierarchy. | [`Model.properties`](Model.md) |
| `sourceModel?` | [`Model`](Model.md) | The model that is referenced via `model is`. | [`Model.sourceModel`](Model.md) |
| ~~`templateArguments?`~~ | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br />use templateMapper instead. | [`Model.templateArguments`](Model.md) |
| `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`Model.templateMapper`](Model.md) |
| `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`Model.templateNode`](Model.md) |

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

[`Model.projectionsByName`](Model.md#projectionsbyname)
