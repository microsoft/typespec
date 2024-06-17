---
jsApi: true
title: "[I] SignatureFunctionParameter"

---
Represent a function parameter that represent the parameter signature(i.e the type would be the type of the value passed)

## Extends

- [`FunctionParameterBase`](FunctionParameterBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `entityKind` | `readonly` | `"Type"` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | [`FunctionParameterBase`](FunctionParameterBase.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | <p>Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished:</p><ul><li>a template declaration will not</li><li>a template instance that argument that are still template parameters</li><li>a template instance that is only partially instantiated(like a templated operation inside a templated interface)</li></ul> | [`FunctionParameterBase`](FunctionParameterBase.md).`isFinished` |
| `kind` | `public` | `"FunctionParameter"` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`kind` |
| `mixed` | `public` | `false` | - | - |
| `name` | `public` | `string` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`name` |
| `node` | `public` | [`FunctionParameterNode`](FunctionParameterNode.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`node` |
| `optional` | `public` | `boolean` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`optional` |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projector` |
| `rest` | `public` | `boolean` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`rest` |
| `type` | `public` | [`Type`](../type-aliases/Type.md) | - | - |

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
