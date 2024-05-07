---
jsApi: true
title: "[F] assertType"

---
```ts
assertType<TKind>(
   typeDescription, 
   t, ...
   kinds): asserts t is Type & Object
```

Assert that the input type has one of the kinds provided

## Type parameters

| Type parameter |
| :------ |
| `TKind` extends (
  \| `"Enum"`
  \| `"Interface"`
  \| `"Intrinsic"`
  \| `"Model"`
  \| `"Operation"`
  \| `"Scalar"`
  \| `"Union"`
  \| `"Boolean"`
  \| `"Decorator"`
  \| `"EnumMember"`
  \| `"FunctionParameter"`
  \| `"Function"`
  \| `"ModelProperty"`
  \| `"Namespace"`
  \| `"Number"`
  \| `"Object"`
  \| `"Projection"`
  \| `"ScalarConstructor"`
  \| `"String"`
  \| `"StringTemplate"`
  \| `"StringTemplateSpan"`
  \| `"TemplateParameter"`
  \| `"Tuple"`
  \| `"UnionVariant"`)[] |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDescription` | `string` |
| `t` | [`Type`](../type-aliases/Type.md) |
| ...`kinds` | `TKind` |

## Returns

`asserts t is Type & Object`
