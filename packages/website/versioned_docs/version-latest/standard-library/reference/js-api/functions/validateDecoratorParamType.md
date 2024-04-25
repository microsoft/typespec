---
jsApi: true
title: "[F] validateDecoratorParamType"

---
```ts
validateDecoratorParamType<K>(
   program, 
   target, 
   value, 
   expectedType): value is InferredTypeSpecValue<K>
```

Validate a decorator parameter has the correct type.

## Type parameters

| Type parameter |
| :------ |
| `K` extends 
  \| `"Scalar"`
  \| `"ModelProperty"`
  \| `"Model"`
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
  \| `"Projection"` |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../type-aliases/Type.md) | Decorator target |
| `value` | [`TypeSpecValue`](../type-aliases/TypeSpecValue.md) | Value of the parameter. |
| `expectedType` | `K` \| `K`[] | Expected type or list of expected type |

## Returns

`value is InferredTypeSpecValue<K>`

true if the value is of one of the type in the list of expected types. If not emit a diagnostic.

## Deprecated

use

## See

createDecoratorDefinition#validate instead.
