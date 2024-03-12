---
jsApi: true
title: "[I] StringTemplateSpanValue"

---
## Extends

- [`BaseType`](BaseType.md)

## Properties

| Property | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` | [`BaseType`](BaseType.md).`isFinished` |
| `isInterpolated` | `true` | - | - | - |
| `kind` | `"StringTemplateSpan"` | - | [`BaseType`](BaseType.md).`kind` | [`BaseType`](BaseType.md).`kind` |
| `node` | [`Expression`](../type-aliases/Expression.md) | - | [`BaseType`](BaseType.md).`node` | [`BaseType`](BaseType.md).`node` |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` | [`BaseType`](BaseType.md).`projector` |
| `type` | [`Type`](../type-aliases/Type.md) | - | - | - |

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

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
