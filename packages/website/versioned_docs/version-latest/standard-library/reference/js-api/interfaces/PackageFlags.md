---
jsApi: true
title: "[I] PackageFlags"

---
## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `decoratorArgMarshalling?` | `readonly` | `"new"` \| `"legacy"` | <p>Decorator arg marshalling algorithm. Specify how TypeSpec values are marshalled to decorator arguments.</p><ul><li>`lossless` - New recommended behavior</li><li>string value -> `string`</li><li>numeric value -> `number` if the constraint can be represented as a JS number, Numeric otherwise(e.g. for types int64, decimal128, numeric, etc.)</li><li>boolean value -> `boolean`</li><li>null value -> `null`</li><li></li><li>`legacy` Behavior before version 0.56.0.</li><li>string value -> `string`</li><li>numeric value -> `number`</li><li>boolean value -> `boolean`</li><li>null value -> `NullType`</li></ul><p>**Default**</p><code>legacy</code> |
