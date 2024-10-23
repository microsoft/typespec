---
jsApi: true
title: "[I] RecordModelType"

---
## Extends

- [`Model`](Model.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `baseModel?` | `public` | [`Model`](Model.md) | Model this model extends. This represent inheritance. | - | [`Model`](Model.md).`baseModel` |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | - | [`Model`](Model.md).`decorators` |
| `derivedModels` | `public` | [`Model`](Model.md)[] | Direct children. This is the reverse relation of [baseModel](Model.md) | - | [`Model`](Model.md).`derivedModels` |
| `entityKind` | `readonly` | `"Type"` | - | - | [`Model`](Model.md).`entityKind` |
| `indexer` | `public` | `object` | - | [`Model`](Model.md).`indexer` | - |
| `indexer.key` | `public` | [`Scalar`](Scalar.md) | - | - | - |
| `indexer.value` | `public` | [`Type`](../type-aliases/Type.md) | - | - | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`Model`](Model.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`Model`](Model.md).`isFinished` |
| `kind` | `public` | `"Model"` | - | - | [`Model`](Model.md).`kind` |
| `name` | `public` | `string` | - | - | [`Model`](Model.md).`name` |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | [`Model`](Model.md).`namespace` |
| `node?` | `public` | \| [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md) \| [`ObjectLiteralNode`](ObjectLiteralNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md) | - | - | [`Model`](Model.md).`node` |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`Model`](Model.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`Model`](Model.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`Model`](Model.md).`projector` |
| `properties` | `public` | `RekeyableMap`<`string`, [`ModelProperty`](ModelProperty.md)\> | The properties of the model. Properties are ordered in the order that they appear in source. Properties obtained via `model is` appear before properties defined in the model body. Properties obtained via `...` are inserted where the spread appears in source. Properties inherited via `model extends` are not included. Use [walkPropertiesInherited](../functions/walkPropertiesInherited.md) to enumerate all properties in the inheritance hierarchy. | - | [`Model`](Model.md).`properties` |
| `sourceModel?` | `public` | [`Model`](Model.md) | The model that is referenced via `model is`. | - | [`Model`](Model.md).`sourceModel` |
| `sourceModels` | `public` | [`SourceModel`](SourceModel.md)[] | Models that were used to build this model. This include any model referenced in `model is`, `...` or when intersecting models. | - | [`Model`](Model.md).`sourceModels` |
| ~~`templateArguments?`~~ | `public` | ([`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) \| [`IndeterminateEntity`](IndeterminateEntity.md))[] | **Deprecated** use templateMapper instead. | - | [`Model`](Model.md).`templateArguments` |
| `templateMapper?` | `public` | [`TypeMapper`](TypeMapper.md) | - | - | [`Model`](Model.md).`templateMapper` |
| `templateNode?` | `public` | [`Node`](../type-aliases/Node.md) | - | - | [`Model`](Model.md).`templateNode` |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`Model`](Model.md).[`projections`](Model.md#projections)

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

[`Model`](Model.md).[`projectionsByName`](Model.md#projectionsbyname)
