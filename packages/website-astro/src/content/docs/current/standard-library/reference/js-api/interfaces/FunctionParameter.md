---
jsApi: true
title: "[I] FunctionParameter"

---
## Extends

- [`BaseType`](BaseType.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `"FunctionParameter"` | - | [`BaseType`](BaseType.md).`kind` |
| `name` | `string` | - | - |
| `node` | [`FunctionParameterNode`](FunctionParameterNode.md) | - | [`BaseType`](BaseType.md).`node` |
| `optional` | `boolean` | - | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` |
| `rest` | `boolean` | - | - |
| `type` | [`Type`](../type-aliases/Type.md) \| [`ValueType`](ValueType.md) | - | - |

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
