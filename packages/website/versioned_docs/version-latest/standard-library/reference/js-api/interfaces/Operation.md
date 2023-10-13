---
jsApi: true
title: "[I] Operation"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `interface?` | [`Interface`](Interface.md) | - | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `"Operation"` | - | [`BaseType`](BaseType.md).`kind` |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `node` | [`OperationStatementNode`](OperationStatementNode.md) | - | [`BaseType`](BaseType.md).`node` |
| `parameters` | [`Model`](Model.md) | - | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` |
| `returnType` | [`Type`](../type-aliases/Type.md) | - | - |
| `sourceOperation?` | [`Operation`](Operation.md) | The operation that is referenced via `op is`. | - |
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
