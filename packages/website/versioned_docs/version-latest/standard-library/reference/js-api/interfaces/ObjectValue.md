---
jsApi: true
title: "[I] ObjectValue"

---
## Extends

- `BaseValue`

## Properties

| Property | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `node` | [`ObjectLiteralNode`](ObjectLiteralNode.md) | - | - | - |
| `properties` | `Map`<`string`, [`ObjectValuePropertyDescriptor`](ObjectValuePropertyDescriptor.md)\> | - | - | - |
| `type` | [`Type`](../type-aliases/Type.md) | Represent the storage type of a value.<br /><br />**Example**<br />`p const a = "hello"; // Type here would be "hello" const b: string = a;  // Type here would be string const c: string \| int32 = b; // Type here would be string \| int32 ` | `BaseValue.type` | `BaseValue.type` |
| `valueKind` | `"ObjectValue"` | - | `BaseValue.valueKind` | `BaseValue.valueKind` |
