---
jsApi: true
title: "[I] Interface"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `kind` | `"Interface"` | - | [`BaseType.kind`](BaseType.md) |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `node` | [`InterfaceStatementNode`](InterfaceStatementNode.md) | - | [`BaseType.node`](BaseType.md) |
| `operations` | `RekeyableMap`<`string`, [`Operation`](Operation.md)\> | The operations of the interface.<br /><br />Operations are ordered in the order that they appear in the source.<br />Operations obtained via `interface extends` appear before operations<br />declared in the interface body. | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
| `sourceInterfaces` | [`Interface`](Interface.md)[] | The interfaces that provide additional operations via `interface extends`.<br /><br />Note that despite the same `extends` keyword in source form, this is a<br />different semantic relationship than the one from [Model](Model.md) to<br />[Model.baseModel](ArrayModelType.md). Operations from extended interfaces are copied<br />into [Interface.operations](Interface.md). | - |
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
