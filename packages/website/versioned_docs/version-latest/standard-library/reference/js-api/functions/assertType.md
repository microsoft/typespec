---
jsApi: true
title: "[F] assertType"

---
```ts
assertType<TKind>(
   typeDescription, 
   t, ...
   kinds): asserts t is Object
```

Assert that the input type has one of the kinds provided

## Type parameters

| Parameter |
| :------ |
| `TKind` extends (
  \| `"Model"`
  \| `"ModelProperty"`
  \| `"Scalar"`
  \| `"Interface"`
  \| `"Enum"`
  \| `"EnumMember"`
  \| `"TemplateParameter"`
  \| `"Namespace"`
  \| `"Operation"`
  \| `"String"`
  \| `"Number"`
  \| `"Boolean"`
  \| `"StringTemplate"`
  \| `"StringTemplateSpan"`
  \| `"Tuple"`
  \| `"Union"`
  \| `"UnionVariant"`
  \| `"Intrinsic"`
  \| `"Function"`
  \| `"Decorator"`
  \| `"FunctionParameter"`
  \| `"Object"`
  \| `"Projection"`)[] |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDescription` | `string` |
| `t` | [`Type`](../type-aliases/Type.md) |
| ...`kinds` | `TKind` |

## Returns

`asserts t is Object`
