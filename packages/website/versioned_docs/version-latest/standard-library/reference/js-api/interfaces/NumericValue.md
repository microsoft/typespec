---
jsApi: true
title: "[I] NumericValue"

---
## Extends

- `BaseValue`

## Properties

| Property | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `scalar` | `undefined` \| [`Scalar`](Scalar.md) | - | - | - |
| `type` | [`Type`](../type-aliases/Type.md) | Represent the storage type of a value.<br /><br />**Example**<br />`p const a = "hello"; // Type here would be "hello" const b: string = a;  // Type here would be string const c: string \| int32 = b; // Type here would be string \| int32 ` | `BaseValue.type` | `BaseValue.type` |
| `value` | [`Numeric`](Numeric.md) | - | - | - |
| `valueKind` | `"NumericValue"` | - | `BaseValue.valueKind` | `BaseValue.valueKind` |
