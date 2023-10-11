---
jsApi: true
title: "[I] ArrayModelType"

---
## Extends

- [`Model`](Model.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `baseModel?` | [`Model`](Model.md) | Model this model extends. This represent inheritance. | [`Model`](Model.md).`baseModel` |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`Model`](Model.md).`decorators` |
| `derivedModels` | [`Model`](Model.md)[] | Direct children. This is the reverse relation of [baseModel](ArrayModelType.md) | [`Model`](Model.md).`derivedModels` |
| `indexer` | `object` | - | [`Model`](Model.md).`indexer` |
| `indexer.key` | [`Scalar`](Scalar.md) | - | - |
| `indexer.value` | [`Type`](../type-aliases/Type.md) | - | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`Model`](Model.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`Model`](Model.md).`isFinished` |
| `kind` | `"Model"` | - | [`Model`](Model.md).`kind` |
| `name` | `string` | - | [`Model`](Model.md).`name` |
| `namespace?` | [`Namespace`](Namespace.md) | - | [`Model`](Model.md).`namespace` |
| `node?` | [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md) | - | [`Model`](Model.md).`node` |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`Model`](Model.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`Model`](Model.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`Model`](Model.md).`projector` |
| `properties` | `RekeyableMap`<`string`, [`ModelProperty`](ModelProperty.md)\> | The properties of the model.<br /><br />Properties are ordered in the order that they appear in source.<br />Properties obtained via `model is` appear before properties defined in<br />the model body. Properties obtained via `...` are inserted where the<br />spread appears in source.<br /><br />Properties inherited via `model extends` are not included. Use<br />[walkPropertiesInherited](../functions/walkPropertiesInherited.md) to enumerate all properties in the<br />inheritance hierarchy. | [`Model`](Model.md).`properties` |
| `sourceModel?` | [`Model`](Model.md) | The model that is referenced via `model is`. | [`Model`](Model.md).`sourceModel` |
| `templateArguments?` | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br /><br />use templateMapper instead. | [`Model`](Model.md).`templateArguments` |
| `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`Model`](Model.md).`templateMapper` |
| `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`Model`](Model.md).`templateNode` |

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

[`Model`](Model.md).[`projectionsByName`](Model.md#projectionsbyname)
