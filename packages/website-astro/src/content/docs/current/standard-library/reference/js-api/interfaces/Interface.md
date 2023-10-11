---
jsApi: true
title: "[I] Interface"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `"Interface"` | - | [`BaseType`](BaseType.md).`kind` |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `node` | [`InterfaceStatementNode`](InterfaceStatementNode.md) | - | [`BaseType`](BaseType.md).`node` |
| `operations` | `RekeyableMap`<`string`, [`Operation`](Operation.md)\> | The operations of the interface.<br /><br />Operations are ordered in the order that they appear in the source.<br />Operations obtained via `interface extends` appear before operations<br />declared in the interface body. | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` |
| `sourceInterfaces` | [`Interface`](Interface.md)[] | The interfaces that provide additional operations via `interface extends`.<br /><br />Note that despite the same `extends` keyword in source form, this is a<br />different semantic relationship than the one from [Model](Model.md) to<br />[Model.baseModel](ArrayModelType.md). Operations from extended interfaces are copied<br />into [Interface.operations](Interface.md). | - |
| `templateArguments?` | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br /><br />use templateMapper instead. | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` |
| `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` |
| `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` |

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

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
