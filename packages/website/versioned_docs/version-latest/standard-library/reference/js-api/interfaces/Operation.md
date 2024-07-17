---
jsApi: true
title: "[I] Operation"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `entityKind` | `readonly` | `"Type"` | - | - | [`BaseType`](BaseType.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `interface?` | `public` | [`Interface`](Interface.md) | - | - | - |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Operation"` | - | [`BaseType`](BaseType.md).`kind` | - |
| `name` | `public` | `string` | - | - | - |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `node` | `public` | [`OperationStatementNode`](OperationStatementNode.md) | - | [`BaseType`](BaseType.md).`node` | - |
| `parameters` | `public` | [`Model`](Model.md) | - | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`BaseType`](BaseType.md).`projector` |
| `returnType` | `public` | [`Type`](../type-aliases/Type.md) | - | - | - |
| `sourceOperation?` | `public` | [`Operation`](Operation.md) | The operation that is referenced via `op is`. | - | - |
| ~~`templateArguments?`~~ | `public` | ([`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) \| [`IndeterminateEntity`](IndeterminateEntity.md))[] | **Deprecated** use templateMapper instead. | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateArguments` |
| `templateMapper?` | `public` | [`TypeMapper`](TypeMapper.md) | - | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateMapper` |
| `templateNode?` | `public` | [`Node`](../type-aliases/Node.md) | - | - | [`TemplatedTypeBase`](TemplatedTypeBase.md).`templateNode` |

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
