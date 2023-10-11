---
jsApi: true
title: "[I] BaseType"

---
## Extended By

- [`ObjectType`](ObjectType.md)
- [`Projection`](Projection.md)
- [`IntrinsicType`](IntrinsicType.md)
- [`Model`](Model.md)
- [`ModelProperty`](ModelProperty.md)
- [`Scalar`](Scalar.md)
- [`Interface`](Interface.md)
- [`Enum`](Enum.md)
- [`EnumMember`](EnumMember.md)
- [`Operation`](Operation.md)
- [`Namespace`](Namespace.md)
- [`StringLiteral`](StringLiteral.md)
- [`NumericLiteral`](NumericLiteral.md)
- [`BooleanLiteral`](BooleanLiteral.md)
- [`Tuple`](Tuple.md)
- [`Union`](Union.md)
- [`UnionVariant`](UnionVariant.md)
- [`TemplateParameter`](TemplateParameter.md)
- [`Decorator`](Decorator.md)
- [`FunctionType`](FunctionType.md)
- [`FunctionParameter`](FunctionParameter.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `string` | - |
| `node?` | [`Node`](../type-aliases/Node.md) | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - |
| `projector?` | [`Projector`](Projector.md) | - |

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
