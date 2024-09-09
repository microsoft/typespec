---
jsApi: true
title: "[I] MixedFunctionParameter"

---
Represent a function parameter that could accept types or values in the TypeSpec program.

## Extends

- [`FunctionParameterBase`](FunctionParameterBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `entityKind` | `readonly` | `"Type"` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | [`FunctionParameterBase`](FunctionParameterBase.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`FunctionParameterBase`](FunctionParameterBase.md).`isFinished` |
| `kind` | `public` | `"FunctionParameter"` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`kind` |
| `mixed` | `public` | `true` | - | - |
| `name` | `public` | `string` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`name` |
| `node` | `public` | [`FunctionParameterNode`](FunctionParameterNode.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`node` |
| `optional` | `public` | `boolean` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`optional` |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | [`FunctionParameterBase`](FunctionParameterBase.md).`projector` |
| `rest` | `public` | `boolean` | - | [`FunctionParameterBase`](FunctionParameterBase.md).`rest` |
| `type` | `public` | [`MixedParameterConstraint`](MixedParameterConstraint.md) | - | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`FunctionParameterBase`](FunctionParameterBase.md).[`projections`](FunctionParameterBase.md#projections)

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

[`FunctionParameterBase`](FunctionParameterBase.md).[`projectionsByName`](FunctionParameterBase.md#projectionsbyname)
