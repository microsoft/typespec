---
jsApi: true
title: "[I] Union"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `public` | `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `public` | `expression` | `boolean` | - | - |
| `public` | `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `public` | `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` |
| `public` | `kind` | `"Union"` | - | [`BaseType`](BaseType.md).`kind` |
| `public` | `name?` | `string` | - | - |
| `public` | `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `public` | `node` | [`UnionStatementNode`](UnionStatementNode.md) \| [`UnionExpressionNode`](UnionExpressionNode.md) | - | [`BaseType`](BaseType.md).`node` |
| `readonly` | `options` | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br /><br />use variants | - |
| `public` | `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` |
| `public` | `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` |
| `public` | `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` |
| `public` | `templateArguments?` | [`Type`](../type-aliases/Type.md)[] | **Deprecated**<br /><br />use templateMapper instead. | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` |
| `public` | `templateMapper?` | [`TypeMapper`](TypeMapper.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` |
| `public` | `templateNode?` | [`Node`](../type-aliases/Node.md) | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` |
| `public` | `variants` | `RekeyableMap`<`string` \| `symbol`, [`UnionVariant`](UnionVariant.md)\> | The variants of the union.<br /><br />Variants are ordered in order that they appear in source. | - |

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
