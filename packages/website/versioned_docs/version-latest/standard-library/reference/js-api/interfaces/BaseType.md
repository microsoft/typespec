---
jsApi: true
title: "[I] BaseType"

---
## Extended by

- [`ObjectType`](ObjectType.md)
- [`Projection`](Projection.md)
- [`IntrinsicType`](IntrinsicType.md)
- [`Model`](Model.md)
- [`ModelProperty`](ModelProperty.md)
- [`Scalar`](Scalar.md)
- [`ScalarConstructor`](ScalarConstructor.md)
- [`Interface`](Interface.md)
- [`Enum`](Enum.md)
- [`EnumMember`](EnumMember.md)
- [`Operation`](Operation.md)
- [`Namespace`](Namespace.md)
- [`StringLiteral`](StringLiteral.md)
- [`NumericLiteral`](NumericLiteral.md)
- [`BooleanLiteral`](BooleanLiteral.md)
- [`StringTemplate`](StringTemplate.md)
- [`StringTemplateSpanLiteral`](StringTemplateSpanLiteral.md)
- [`StringTemplateSpanValue`](StringTemplateSpanValue.md)
- [`Tuple`](Tuple.md)
- [`Union`](Union.md)
- [`UnionVariant`](UnionVariant.md)
- [`TemplateParameter`](TemplateParameter.md)
- [`Decorator`](Decorator.md)
- [`FunctionType`](FunctionType.md)
- [`FunctionParameterBase`](FunctionParameterBase.md)

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `entityKind` | `readonly` | `"Type"` | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - |
| `isFinished` | `public` | `boolean` | <p>Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished:</p><ul><li>a template declaration will not</li><li>a template instance that argument that are still template parameters</li><li>a template instance that is only partially instantiated(like a templated operation inside a templated interface)</li></ul> |
| `kind` | `public` | `string` | - |
| `node?` | `public` | [`Node`](../type-aliases/Node.md) | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - |
| `projector?` | `public` | [`Projector`](Projector.md) | - |

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
