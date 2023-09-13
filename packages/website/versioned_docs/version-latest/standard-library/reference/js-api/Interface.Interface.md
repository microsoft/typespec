---
jsApi: true
title: "[I] Interface"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md).[`TemplatedTypeBase`](Interface.TemplatedTypeBase.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Interface"` | - |
| `name` | `string` | - |
| `namespace`? | [`Namespace`](Interface.Namespace.md) | - |
| `node` | [`InterfaceStatementNode`](Interface.InterfaceStatementNode.md) | - |
| `operations` | `RekeyableMap`< `string`, [`Operation`](Interface.Operation.md) \> | The operations of the interface.<br /><br />Operations are ordered in the order that they appear in the source.<br />Operations obtained via `interface extends` appear before operations<br />declared in the interface body. |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `sourceInterfaces` | [`Interface`](Interface.Interface.md)[] | The interfaces that provide additional operations via `interface extends`.<br /><br />Note that despite the same `extends` keyword in source form, this is a<br />different semantic relationship than the one from [Model](Interface.Model.md) to<br />[baseModel](Interface.ArrayModelType.md#basemodel). Operations from extended interfaces are copied<br />into [operations](Interface.Interface.md#operations). |
| `symbol`? | [`Sym`](Interface.Sym.md) | Late-bound symbol of this interface type. |
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
