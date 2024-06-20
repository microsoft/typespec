---
jsApi: true
title: "[I] FunctionParameterBase"

---
## Extends

- [`BaseType`](BaseType.md)

## Extended by

- [`MixedFunctionParameter`](MixedFunctionParameter.md)
- [`SignatureFunctionParameter`](SignatureFunctionParameter.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `entityKind` | `readonly` | `"Type"` | - | [`BaseType`](BaseType.md).`entityKind` | [`BaseType`](BaseType.md).`entityKind` |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | <p>Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished:</p><ul><li>a template declaration will not</li><li>a template instance that argument that are still template parameters</li><li>a template instance that is only partially instantiated(like a templated operation inside a templated interface)</li></ul> | [`BaseType`](BaseType.md).`isFinished` | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"FunctionParameter"` | - | [`BaseType`](BaseType.md).`kind` | [`BaseType`](BaseType.md).`kind` |
| `name` | `public` | `string` | - | - | - |
| `node` | `public` | [`FunctionParameterNode`](FunctionParameterNode.md) | - | [`BaseType`](BaseType.md).`node` | [`BaseType`](BaseType.md).`node` |
| `optional` | `public` | `boolean` | - | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` | [`BaseType`](BaseType.md).`projector` |
| `rest` | `public` | `boolean` | - | - | - |

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
