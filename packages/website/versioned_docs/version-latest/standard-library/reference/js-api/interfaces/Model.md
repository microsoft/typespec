---
jsApi: true
title: "[I] Model"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `baseModel?` | [`Model`](Model.md) | Model this model extends. This represent inheritance. | - | - |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` | [`DecoratedType`](DecoratedType.md).`decorators` |
| `derivedModels` | [`Model`](Model.md)[] | Direct children. This is the reverse relation of [baseModel](Model.md) | - | - |
| `indexer?` | [`ModelIndexer`](../type-aliases/ModelIndexer.md) | - | - | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `"Model"` | - | [`BaseType`](BaseType.md).`kind` | [`BaseType`](BaseType.md).`kind` |
| `name` | `string` | - | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - | - |
| `node?` | [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md) | - | [`BaseType`](BaseType.md).`node` | [`BaseType`](BaseType.md).`node` |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` | [`BaseType`](BaseType.md).`projector` |
| `properties` | `RekeyableMap`<`string`, [`ModelProperty`](ModelProperty.md)\> | The properties of the model.<br /><br />Properties are ordered in the order that they appear in source.<br />Properties obtained via `model is` appear before properties defined in<br />the model body. Properties obtained via `...` are inserted where the<br />spread appears in source.<br /><br />Properties inherited via `model extends` are not included. Use<br />[walkPropertiesInherited](../functions/walkPropertiesInherited.md) to enumerate all properties in the<br />inheritance hierarchy. | - | - |
| `sourceModel?` | [`Model`](Model.md) | The model that is referenced via `model is`. | - | - |
| ~~`templateArguments?`~~ | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br />use templateMapper instead. | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` |
| `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` |
| `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` |

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

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
