---
jsApi: true
title: "[I] ModelProperty"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| ~~`default?`~~ | `public` | [`Type`](../type-aliases/Type.md) | **Deprecated** use [defaultValue](ModelProperty.md) instead. | - | - |
| `defaultValue?` | `public` | [`Value`](../type-aliases/Value.md) | - | - | - |
| `entityKind` | `readonly` | `"Type"` | - | - | [`BaseType`](BaseType.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"ModelProperty"` | - | [`BaseType`](BaseType.md).`kind` | - |
| `model?` | `public` | [`Model`](Model.md) | - | - | - |
| `name` | `public` | `string` | - | - | - |
| `node` | `public` | \| [`ModelPropertyNode`](ModelPropertyNode.md) \| [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md) \| [`ProjectionModelPropertyNode`](ProjectionModelPropertyNode.md) \| [`ProjectionModelSpreadPropertyNode`](ProjectionModelSpreadPropertyNode.md) \| [`ObjectLiteralPropertyNode`](ObjectLiteralPropertyNode.md) | - | [`BaseType`](BaseType.md).`node` | - |
| `optional` | `public` | `boolean` | - | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`BaseType`](BaseType.md).`projector` |
| `sourceProperty?` | `public` | [`ModelProperty`](ModelProperty.md) | - | - | - |
| `type` | `public` | [`Type`](../type-aliases/Type.md) | - | - | - |

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
