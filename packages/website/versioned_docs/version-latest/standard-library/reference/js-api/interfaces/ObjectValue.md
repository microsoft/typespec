---
jsApi: true
title: "[I] ObjectValue"

---
## Extends

- `BaseValue`

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `entityKind` | `readonly` | `"Value"` | - | `BaseValue.entityKind` | `BaseValue.entityKind` |
| `node` | `public` | [`ObjectLiteralNode`](ObjectLiteralNode.md) | - | - | - |
| `properties` | `public` | `Map`<`string`, [`ObjectValuePropertyDescriptor`](ObjectValuePropertyDescriptor.md)\> | - | - | - |
| `type` | `public` | [`Type`](../type-aliases/Type.md) | <p>Represent the storage type of a value.</p><p>**Example**</p><code>const a = "hello"; // Type here would be "hello"<p>const b: string = a;  // Type here would be string</p><p>const c: string \| int32 = b; // Type here would be string \| int32</p></code> | `BaseValue.type` | `BaseValue.type` |
| `valueKind` | `public` | `"ObjectValue"` | - | `BaseValue.valueKind` | `BaseValue.valueKind` |
