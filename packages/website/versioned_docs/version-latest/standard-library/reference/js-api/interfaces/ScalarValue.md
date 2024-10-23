---
jsApi: true
title: "[I] ScalarValue"

---
## Extends

- `BaseValue`

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `entityKind` | `readonly` | `"Value"` | - | - | `BaseValue.entityKind` |
| `scalar` | `public` | [`Scalar`](Scalar.md) | - | - | - |
| `type` | `public` | [`Type`](../type-aliases/Type.md) | Represent the storage type of a value. **Example** `const a = "hello"; // Type here would be "hello" const b: string = a; // Type here would be string const c: string | int32 = b; // Type here would be string | int32` | - | `BaseValue.type` |
| `value` | `public` | `object` | - | - | - |
| `value.args` | `public` | [`Value`](../type-aliases/Value.md)[] | - | - | - |
| `value.name` | `public` | `string` | - | - | - |
| `valueKind` | `public` | `"ScalarValue"` | - | `BaseValue.valueKind` | - |
