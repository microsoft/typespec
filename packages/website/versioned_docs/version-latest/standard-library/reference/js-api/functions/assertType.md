---
jsApi: true
title: "[F] assertType"

---
```ts
function assertType<TKind>(
   typeDescription, 
   t, ...
   kinds): asserts t is Type & Object
```

Assert that the input type has one of the kinds provided

## Type parameters

| Type parameter |
| :------ |
| `TKind` *extends* (
  \| `"Boolean"`
  \| `"Decorator"`
  \| `"Enum"`
  \| `"EnumMember"`
  \| `"FunctionParameter"`
  \| `"Function"`
  \| `"Interface"`
  \| `"Intrinsic"`
  \| `"Model"`
  \| `"ModelProperty"`
  \| `"Namespace"`
  \| `"Number"`
  \| `"Object"`
  \| `"Operation"`
  \| `"Projection"`
  \| `"Scalar"`
  \| `"ScalarConstructor"`
  \| `"String"`
  \| `"StringTemplate"`
  \| `"StringTemplateSpan"`
  \| `"TemplateParameter"`
  \| `"Tuple"`
  \| `"Union"`
  \| `"UnionVariant"`)[] |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDescription` | `string` |
| `t` | [`Type`](../type-aliases/Type.md) |
| ...`kinds` | `TKind` |

## Returns

`asserts t is Type & Object`
