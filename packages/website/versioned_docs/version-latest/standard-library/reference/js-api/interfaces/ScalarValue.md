---
jsApi: true
title: "[I] ScalarValue"

---
## Extends

- `BaseValue`

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `entityKind` | `readonly` | `"Value"` | - | `BaseValue.entityKind` | `BaseValue.entityKind` |
| `scalar` | `public` | [`Scalar`](Scalar.md) | - | - | - |
| `type` | `public` | [`Type`](../type-aliases/Type.md) | <p>Represent the storage type of a value.</p><p>**Example**</p><code>const a = "hello"; // Type here would be "hello"<p>const b: string = a;  // Type here would be string</p><p>const c: string \| int32 = b; // Type here would be string \| int32</p></code> | `BaseValue.type` | `BaseValue.type` |
| `value` | `public` | `object` | - | - | - |
| `value.args` | `public` | [`Value`](../type-aliases/Value.md)[] | - | - | - |
| `value.name` | `public` | `string` | - | - | - |
| `valueKind` | `public` | `"ScalarValue"` | - | `BaseValue.valueKind` | `BaseValue.valueKind` |
