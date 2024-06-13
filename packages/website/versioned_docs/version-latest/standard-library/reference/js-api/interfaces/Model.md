---
jsApi: true
title: "[I] Model"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Extended by

- [`ArrayModelType`](ArrayModelType.md)
- [`RecordModelType`](RecordModelType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `baseModel?` | `public` | [`Model`](Model.md) | Model this model extends. This represent inheritance. | - | - |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` | [`DecoratedType`](DecoratedType.md).`decorators` |
| `derivedModels` | `public` | [`Model`](Model.md)[] | Direct children. This is the reverse relation of [baseModel](Model.md) | - | - |
| `entityKind` | `readonly` | `"Type"` | - | [`BaseType`](BaseType.md).`entityKind` | [`BaseType`](BaseType.md).`entityKind` |
| `indexer?` | `public` | [`ModelIndexer`](../type-aliases/ModelIndexer.md) | - | - | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | <p>Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished:</p><ul><li>a template declaration will not</li><li>a template instance that argument that are still template parameters</li><li>a template instance that is only partially instantiated(like a templated operation inside a templated interface)</li></ul> | [`BaseType`](BaseType.md).`isFinished` | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Model"` | - | [`BaseType`](BaseType.md).`kind` | [`BaseType`](BaseType.md).`kind` |
| `name` | `public` | `string` | - | - | - |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `node?` | `public` |  \| [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md) \| [`ObjectLiteralNode`](ObjectLiteralNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md) | - | [`BaseType`](BaseType.md).`node` | [`BaseType`](BaseType.md).`node` |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` | [`BaseType`](BaseType.md).`projector` |
| `properties` | `public` | `RekeyableMap`<`string`, [`ModelProperty`](ModelProperty.md)\> | <p>The properties of the model.</p><p>Properties are ordered in the order that they appear in source. Properties obtained via `model is` appear before properties defined in the model body. Properties obtained via `...` are inserted where the spread appears in source.</p><p>Properties inherited via `model extends` are not included. Use</p><p>[walkPropertiesInherited](../functions/walkPropertiesInherited.md) to enumerate all properties in the inheritance hierarchy.</p> | - | - |
| `sourceModel?` | `public` | [`Model`](Model.md) | The model that is referenced via `model is`. | - | - |
| `sourceModels` | `public` | [`SourceModel`](SourceModel.md)[] | Models that were used to build this model. This include any model referenced in `model is`, `...` or when intersecting models. | - | - |
| ~~`templateArguments?`~~ | `public` | ([`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) \| [`IndeterminateEntity`](IndeterminateEntity.md))[] | <p>**Deprecated**</p><p>use templateMapper instead.</p> | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` |
| `templateMapper?` | `public` | [`TypeMapper`](TypeMapper.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` |
| `templateNode?` | `public` | [`Node`](../type-aliases/Node.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` |

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
