---
jsApi: true
title: "[I] Interface"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md).[`TemplatedTypeBase`](TemplatedTypeBase.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `entityKind` | `readonly` | `"Type"` | - | - | [`BaseType`](BaseType.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Interface"` | - | [`BaseType`](BaseType.md).`kind` | - |
| `name` | `public` | `string` | - | - | - |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `node` | `public` | [`InterfaceStatementNode`](InterfaceStatementNode.md) | - | [`BaseType`](BaseType.md).`node` | - |
| `operations` | `public` | `RekeyableMap`<`string`, [`Operation`](Operation.md)\> | The operations of the interface. Operations are ordered in the order that they appear in the source. Operations obtained via `interface extends` appear before operations declared in the interface body. | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`BaseType`](BaseType.md).`projector` |
| `sourceInterfaces` | `public` | [`Interface`](Interface.md)[] | The interfaces that provide additional operations via `interface extends`. Note that despite the same `extends` keyword in source form, this is a different semantic relationship than the one from [Model](Model.md) to [Model.baseModel](Model.md). Operations from extended interfaces are copied into [Interface.operations](Interface.md). | - | - |
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
