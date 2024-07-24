---
jsApi: true
title: "[I] Union"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `entityKind` | `readonly` | `"Type"` | - | - | [`BaseType`](BaseType.md).`entityKind` |
| `expression` | `public` | `boolean` | - | - | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Union"` | - | [`BaseType`](BaseType.md).`kind` | - |
| `name?` | `public` | `string` | - | - | - |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `node` | `public` | [`UnionStatementNode`](UnionStatementNode.md) \| [`UnionExpressionNode`](UnionExpressionNode.md) | - | [`BaseType`](BaseType.md).`node` | - |
| ~~`options`~~ | `readonly` | [`Type`](../type-aliases/Type.md)[] | **Deprecated** use variants | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`BaseType`](BaseType.md).`projector` |
| ~~`templateArguments?`~~ | `public` | ([`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) \| [`IndeterminateEntity`](IndeterminateEntity.md))[] | **Deprecated** use templateMapper instead. | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` |
| `templateMapper?` | `public` | [`TypeMapper`](TypeMapper.md) | - | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` |
| `templateNode?` | `public` | [`Node`](../type-aliases/Node.md) | - | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` |
| `variants` | `public` | `RekeyableMap`<`string` \| `symbol`, [`UnionVariant`](UnionVariant.md)\> | The variants of the union. Variants are ordered in order that they appear in source. | - | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`BaseType`](BaseType.md).[`projections`](BaseType.md#projections)

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
