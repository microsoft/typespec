---
jsApi: true
title: "[I] Union"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md).[`TemplatedTypeBase`](Interface.TemplatedTypeBase.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `expression` | `boolean` | - |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Union"` | - |
| `name`? | `string` | - |
| `namespace`? | [`Namespace`](Interface.Namespace.md) | - |
| `node` | [`UnionStatementNode`](Interface.UnionStatementNode.md) \| [`UnionExpressionNode`](Interface.UnionExpressionNode.md) | - |
| `readonly` `options` | [`Type`](Type.Type.md)[] | **Deprecated**<br /><br />use variants |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `symbol`? | [`Sym`](Interface.Sym.md) | Late-bound symbol of this interface type. |
| `templateArguments`? | [`Type`](Type.Type.md)[] | **Deprecated**<br /><br />use templateMapper instead. |
| `templateMapper`? | [`TypeMapper`](Interface.TypeMapper.md) | - |
| `templateNode`? | [`Node`](Type.Node.md) | - |
| `variants` | `RekeyableMap`< `string` \| `symbol`, [`UnionVariant`](Interface.UnionVariant.md) \> | The variants of the union.<br /><br />Variants are ordered in order that they appear in source. |

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
