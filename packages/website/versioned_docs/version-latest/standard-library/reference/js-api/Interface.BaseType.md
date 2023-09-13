---
jsApi: true
title: "[I] BaseType"

---
## Extended By

- [`ObjectType`](Interface.ObjectType.md)
- [`Projection`](Interface.Projection.md)
- [`IntrinsicType`](Interface.IntrinsicType.md)
- [`Model`](Interface.Model.md)
- [`ModelProperty`](Interface.ModelProperty.md)
- [`Scalar`](Interface.Scalar.md)
- [`Interface`](Interface.Interface.md)
- [`Enum`](Interface.Enum.md)
- [`EnumMember`](Interface.EnumMember.md)
- [`Operation`](Interface.Operation.md)
- [`Namespace`](Interface.Namespace.md)
- [`StringLiteral`](Interface.StringLiteral.md)
- [`NumericLiteral`](Interface.NumericLiteral.md)
- [`BooleanLiteral`](Interface.BooleanLiteral.md)
- [`Tuple`](Interface.Tuple.md)
- [`Union`](Interface.Union.md)
- [`UnionVariant`](Interface.UnionVariant.md)
- [`TemplateParameter`](Interface.TemplateParameter.md)
- [`Decorator`](Interface.Decorator.md)
- [`FunctionType`](Interface.FunctionType.md)
- [`FunctionParameter`](Interface.FunctionParameter.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `string` | - |
| `node`? | [`Node`](Type.Node.md) | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

## Methods

### projectionsByName

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](Interface.ProjectionStatementNode.md)[]
