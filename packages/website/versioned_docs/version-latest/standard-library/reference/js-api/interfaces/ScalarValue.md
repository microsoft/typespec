---
jsApi: true
title: "[I] ScalarValue"

---
## Extends

- `BaseValue`

## Properties

| Property | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `scalar` | [`Scalar`](Scalar.md) | - | - | - |
| `type` | [`Type`](../type-aliases/Type.md) | Represent the storage type of a value.<br /><br />**Example**<br />`p const a = "hello"; // Type here would be "hello" const b: string = a;  // Type here would be string const c: string \| int32 = b; // Type here would be string \| int32 ` | `BaseValue.type` | `BaseValue.type` |
| `value` | `Object` | - | - | - |
| `value.args` | [`Value`](../type-aliases/Value.md)[] | - | - | - |
| `value.name` | `string` | - | - | - |
| `valueKind` | `"ScalarValue"` | - | `BaseValue.valueKind` | `BaseValue.valueKind` |
