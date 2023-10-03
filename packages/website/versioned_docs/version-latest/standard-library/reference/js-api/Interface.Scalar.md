---
jsApi: true
title: "[I] Scalar"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md).[`TemplatedTypeBase`](Interface.TemplatedTypeBase.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `baseScalar`? | [`Scalar`](Interface.Scalar.md) | Scalar this scalar extends. |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `derivedScalars` | [`Scalar`](Interface.Scalar.md)[] | Direct children. This is the reverse relation of<br /><br />**See**<br /><br />baseScalar |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Scalar"` | - |
| `name` | `string` | - |
| `namespace`? | [`Namespace`](Interface.Namespace.md) | Namespace the scalar was defined in. |
| `node` | [`ScalarStatementNode`](Interface.ScalarStatementNode.md) | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
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
