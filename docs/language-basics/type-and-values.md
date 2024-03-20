---
id: "type-and-values"
title: "Type and Values"
---

# Type and Values in TypeSpec

TypeSpec has the concept of Types and Values, entities can be either a Type, a Value or both depending on the context.

| Entity Name          | Type | Value |
| -------------------- | ---- | ----- |
| `Namespace`          | ✅   |       |
| `Model`              | ✅   |       |
| `ModelProperty`      | ✅   |       |
| `Union`              | ✅   |       |
| `UnionVariant`       | ✅   |       |
| `Interface`          | ✅   |       |
| `Operation`          | ✅   |       |
| `Scalar`             | ✅   |       |
| `Tuple`              | ✅   |       |
| `Enum`               | ✅   |       |
| `EnumMember`         | ✅   | ✅    |
| `StringLiteral`      | ✅   | ✅    |
| `NumberLiteral`      | ✅   | ✅    |
| `BooleanLiteral`     | ✅   | ✅    |
| `ObjectLiteral`      |      | ✅    |
| `TupleLiteral`       |      | ✅    |
| ---- _intrinsic_ --- | ---  | ---   |
| `null`               | ✅   | ✅    |
| `unknown`            | ✅   |       |

## Contexts

There is 3 context that can exists in TypeSpec:

- **Type only** This is when an expression can only be a Type.
  - Model property type
  - Array element type
  - Tuple values
  - Operation parameters
  - Operation return type
  - Union variant type with some exceptions when used as a decorator or template parameter constraint.
- **Value only** This is when an expression can only be a Value.
  - Default values
- **Type and Value Constaints** This is when an expression can be a type or a `valueof`
  - Decorator parameters
  - Template parameters
- **Type and Value** This is when an expression can be a type or a value.
  - Aliases
  - Decorator arguments
  - Template arguments
