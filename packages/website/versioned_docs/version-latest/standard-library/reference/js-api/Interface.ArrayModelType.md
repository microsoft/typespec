---
jsApi: true
title: "[I] ArrayModelType"

---
## Extends

- [`Model`](Interface.Model.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `baseModel`? | [`Model`](Interface.Model.md) | Model this model extends. This represent inheritance. |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `derivedModels` | [`Model`](Interface.Model.md)[] | Direct children. This is the reverse relation of [baseModel](Interface.ArrayModelType.md#basemodel) |
| `indexer` | `object` | - |
| `indexer.key` | [`Scalar`](Interface.Scalar.md) | - |
| `indexer.value` | [`Type`](Type.Type.md) | - |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Model"` | - |
| `name` | `string` | - |
| `namespace`? | [`Namespace`](Interface.Namespace.md) | - |
| `node`? | [`ModelStatementNode`](Interface.ModelStatementNode.md) \| [`ModelExpressionNode`](Interface.ModelExpressionNode.md) \| [`IntersectionExpressionNode`](Interface.IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](Interface.ProjectionModelExpressionNode.md) | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `properties` | `RekeyableMap`< `string`, [`ModelProperty`](Interface.ModelProperty.md) \> | The properties of the model.<br /><br />Properties are ordered in the order that they appear in source.<br />Properties obtained via `model is` appear before properties defined in<br />the model body. Properties obtained via `...` are inserted where the<br />spread appears in source.<br /><br />Properties inherited via `model extends` are not included. Use<br />[walkPropertiesInherited](Function.walkPropertiesInherited.md) to enumerate all properties in the<br />inheritance hierarchy. |
| `sourceModel`? | [`Model`](Interface.Model.md) | The model that is referenced via `model is`. |
| `symbol`? | [`Sym`](Interface.Sym.md) | Late-bound symbol of this model type. |
| `templateArguments`? | [`Type`](Type.Type.md)[] | **Deprecated**<br /><br />use templateMapper instead. |
| `templateMapper`? | [`TypeMapper`](Interface.TypeMapper.md) | - |
| `templateNode`? | [`Node`](Type.Node.md) | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Inherited from

[`Model`](Interface.Model.md).[`projections`](Interface.Model.md#projections)

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

[`Model`](Interface.Model.md).[`projectionsByName`](Interface.Model.md#projectionsbyname)
