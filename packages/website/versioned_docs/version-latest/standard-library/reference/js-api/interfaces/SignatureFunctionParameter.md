---
jsApi: true
title: "[I] SignatureFunctionParameter"

---
Represent a function parameter that represent the parameter signature(i.e the type would be the type of the value passed)

## Extends

- [`FunctionParameterBase`](FunctionParameterBase.md)

## Properties

| Property | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`FunctionParameterBase`](FunctionParameterBase.md).`instantiationParameters` |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`FunctionParameterBase`](FunctionParameterBase.md).`isFinished` |
| `kind` | `"FunctionParameter"` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`kind` |
| `mixed` | `false` | - | - |
| `name` | `string` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`name` |
| `node` | [`FunctionParameterNode`](FunctionParameterNode.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`node` |
| `optional` | `boolean` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`optional` |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projector` |
| `rest` | `boolean` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`rest` |
| `type` | [`Type`](../type-aliases/Type.md) | - | - |

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

[`FunctionParameterBase`](FunctionParameterBase.md).[`projectionsByName`](FunctionParameterBase.md#projectionsbyname)
