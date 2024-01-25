---
jsApi: true
title: "[I] Scalar"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `baseScalar?` | [`Scalar`](Scalar.md) | Scalar this scalar extends. | - |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `derivedScalars` | [`Scalar`](Scalar.md)[] | Direct children. This is the reverse relation of<br /><br />**See**<br />baseScalar | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `kind` | `"Scalar"` | - | [`BaseType.kind`](BaseType.md) |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | Namespace the scalar was defined in. | - |
| `node` | [`ScalarStatementNode`](ScalarStatementNode.md) | - | [`BaseType.node`](BaseType.md) |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
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
