---
jsApi: true
title: "[F] scopeNavigationToNamespace"

---
```ts
scopeNavigationToNamespace<T>(
  namespace,
  listeners,
  options = {}): T
```

Scope the current navigation to the given namespace.

## Type parameters

| Parameter |
| :------ |
| `T` *extends* \{`exitModel`: `undefined` \| `TypeListener`< [`Model`](Interface.Model.md) \>; `model`: `undefined` \| `TypeListener`< [`Model`](Interface.Model.md) \>;} & \{`exitModelProperty`: `undefined` \| `TypeListener`< [`ModelProperty`](Interface.ModelProperty.md) \>; `modelProperty`: `undefined` \| `TypeListener`< [`ModelProperty`](Interface.ModelProperty.md) \>;} & \{`exitScalar`: `undefined` \| `TypeListener`< [`Scalar`](Interface.Scalar.md) \>; `scalar`: `undefined` \| `TypeListener`< [`Scalar`](Interface.Scalar.md) \>;} & \{`exitInterface`: `undefined` \| `TypeListener`< [`Interface`](Interface.Interface.md) \>; `interface`: `undefined` \| `TypeListener`< [`Interface`](Interface.Interface.md) \>;} & \{`enum`: `undefined` \| `TypeListener`< [`Enum`](Interface.Enum.md) \>; `exitEnum`: `undefined` \| `TypeListener`< [`Enum`](Interface.Enum.md) \>;} & \{`enumMember`: `undefined` \| `TypeListener`< [`EnumMember`](Interface.EnumMember.md) \>; `exitEnumMember`: `undefined` \| `TypeListener`< [`EnumMember`](Interface.EnumMember.md) \>;} & \{`exitTemplateParameter`: `undefined` \| `TypeListener`< [`TemplateParameter`](Interface.TemplateParameter.md) \>; `templateParameter`: `undefined` \| `TypeListener`< [`TemplateParameter`](Interface.TemplateParameter.md) \>;} & \{`exitNamespace`: `undefined` \| `TypeListener`< [`Namespace`](Interface.Namespace.md) \>; `namespace`: `undefined` \| `TypeListener`< [`Namespace`](Interface.Namespace.md) \>;} & \{`exitOperation`: `undefined` \| `TypeListener`< [`Operation`](Interface.Operation.md) \>; `operation`: `undefined` \| `TypeListener`< [`Operation`](Interface.Operation.md) \>;} & \{`exitString`: `undefined` \| `TypeListener`< [`StringLiteral`](Interface.StringLiteral.md) \>; `string`: `undefined` \| `TypeListener`< [`StringLiteral`](Interface.StringLiteral.md) \>;} & \{`exitNumber`: `undefined` \| `TypeListener`< [`NumericLiteral`](Interface.NumericLiteral.md) \>; `number`: `undefined` \| `TypeListener`< [`NumericLiteral`](Interface.NumericLiteral.md) \>;} & \{`boolean`: `undefined` \| `TypeListener`< [`BooleanLiteral`](Interface.BooleanLiteral.md) \>; `exitBoolean`: `undefined` \| `TypeListener`< [`BooleanLiteral`](Interface.BooleanLiteral.md) \>;} & \{`exitTuple`: `undefined` \| `TypeListener`< [`Tuple`](Interface.Tuple.md) \>; `tuple`: `undefined` \| `TypeListener`< [`Tuple`](Interface.Tuple.md) \>;} & \{`exitUnion`: `undefined` \| `TypeListener`< [`Union`](Interface.Union.md) \>; `union`: `undefined` \| `TypeListener`< [`Union`](Interface.Union.md) \>;} & \{`exitUnionVariant`: `undefined` \| `TypeListener`< [`UnionVariant`](Interface.UnionVariant.md) \>; `unionVariant`: `undefined` \| `TypeListener`< [`UnionVariant`](Interface.UnionVariant.md) \>;} & \{`exitIntrinsic`: `undefined` \| `TypeListener`< [`IntrinsicType`](Interface.IntrinsicType.md) \>; `intrinsic`: `undefined` \| `TypeListener`< [`IntrinsicType`](Interface.IntrinsicType.md) \>;} & \{`exitFunction`: `undefined` \| `TypeListener`< [`FunctionType`](Interface.FunctionType.md) \>; `function`: `undefined` \| `TypeListener`< [`FunctionType`](Interface.FunctionType.md) \>;} & \{`decorator`: `undefined` \| `TypeListener`< [`Decorator`](Interface.Decorator.md) \>; `exitDecorator`: `undefined` \| `TypeListener`< [`Decorator`](Interface.Decorator.md) \>;} & \{`exitFunctionParameter`: `undefined` \| `TypeListener`< [`FunctionParameter`](Interface.FunctionParameter.md) \>; `functionParameter`: `undefined` \| `TypeListener`< [`FunctionParameter`](Interface.FunctionParameter.md) \>;} & \{`exitObject`: `undefined` \| `TypeListener`< [`ObjectType`](Interface.ObjectType.md) \>; `object`: `undefined` \| `TypeListener`< [`ObjectType`](Interface.ObjectType.md) \>;} & \{`exitProjection`: `undefined` \| `TypeListener`< [`Projection`](Interface.Projection.md) \>; `projection`: `undefined` \| `TypeListener`< [`Projection`](Interface.Projection.md) \>;} |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `namespace` | [`Namespace`](Interface.Namespace.md) | Namespace the traversal shouldn't leave. |
| `listeners` | `T` | Type listeners. |
| `options` | [`NamespaceNavigationOptions`](Interface.NamespaceNavigationOptions.md) | Scope options |

## Returns

`T`

wrapped listeners that that can be used with `navigateType`
