---
jsApi: true
title: "[I] Operation"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md).[`TemplatedTypeBase`](Interface.TemplatedTypeBase.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `interface`? | [`Interface`](Interface.Interface.md) | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Operation"` | - |
| `name` | `string` | - |
| `namespace`? | [`Namespace`](Interface.Namespace.md) | - |
| `node` | [`OperationStatementNode`](Interface.OperationStatementNode.md) | - |
| `parameters` | [`Model`](Interface.Model.md) | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `returnType` | [`Type`](Type.Type.md) | - |
| `sourceOperation`? | [`Operation`](Interface.Operation.md) | The operation that is referenced via `op is`. |
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
