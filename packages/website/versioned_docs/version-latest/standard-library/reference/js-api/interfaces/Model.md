---
jsApi: true
title: "[I] Model"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `baseModel?` | [`Model`](Model.md) | Model this model extends. This represent inheritance. | - |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `derivedModels` | [`Model`](Model.md)[] | Direct children. This is the reverse relation of [baseModel](ArrayModelType.md) | - |
| `indexer?` | [`ModelIndexer`](../type-aliases/ModelIndexer.md) | - | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `kind` | `"Model"` | - | [`BaseType.kind`](BaseType.md) |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `node?` | [`ModelExpressionNode`](ModelExpressionNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ModelStatementNode`](ModelStatementNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md) | - | [`BaseType.node`](BaseType.md) |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
| `properties` | `RekeyableMap`<`string`, [`ModelProperty`](ModelProperty.md)\> | The properties of the model.<br /><br />Properties are ordered in the order that they appear in source.<br />Properties obtained via `model is` appear before properties defined in<br />the model body. Properties obtained via `...` are inserted where the<br />spread appears in source.<br /><br />Properties inherited via `model extends` are not included. Use<br />[walkPropertiesInherited](../functions/walkPropertiesInherited.md) to enumerate all properties in the<br />inheritance hierarchy. | - |
| `sourceModel?` | [`Model`](Model.md) | The model that is referenced via `model is`. | - |
| ~~`templateArguments?`~~ | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br />use templateMapper instead. | [`TemplatedTypeBase.templateArguments`](TemplatedTypeBase.md) |
| `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`TemplatedTypeBase.templateMapper`](TemplatedTypeBase.md) |
| `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`TemplatedTypeBase.templateNode`](TemplatedTypeBase.md) |

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
