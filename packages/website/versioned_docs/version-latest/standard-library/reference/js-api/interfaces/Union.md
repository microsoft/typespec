---
jsApi: true
title: "[I] Union"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `public` | `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `public` | `expression` | `boolean` | - | - |
| `public` | `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `public` | `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `public` | `kind` | `"Union"` | - | [`BaseType.kind`](BaseType.md) |
| `public` | `name?` | `string` | - | - |
| `public` | `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `public` | `node` | [`UnionExpressionNode`](UnionExpressionNode.md) \| [`UnionStatementNode`](UnionStatementNode.md) | - | [`BaseType.node`](BaseType.md) |
| `readonly` | ~~`options`~~ | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br />use variants | - |
| `public` | `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `public` | `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `public` | `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
| `public` | ~~`templateArguments?`~~ | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br />use templateMapper instead. | [`TemplatedTypeBase.templateArguments`](TemplatedTypeBase.md) |
| `public` | `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`TemplatedTypeBase.templateMapper`](TemplatedTypeBase.md) |
| `public` | `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`TemplatedTypeBase.templateNode`](TemplatedTypeBase.md) |
| `public` | `variants` | `RekeyableMap`<`string` \| `symbol`, [`UnionVariant`](UnionVariant.md)\> | The variants of the union.<br /><br />Variants are ordered in order that they appear in source. | - |

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
