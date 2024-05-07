---
jsApi: true
title: "[I] PackageFlags"

---
## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `decoratorArgMarshalling?` | `readonly` | `"new"` \| `"legacy"` | Decorator arg marshalling algorithm. Specify how TypeSpec values are marshalled to decorator arguments.<br />- `lossless` - New recommended behavior<br /> - string value -> `string`<br /> - numeric value -> `number` if the constraint can be represented as a JS number, Numeric otherwise(e.g. for types int64, decimal128, numeric, etc.)<br /> - boolean value -> `boolean`<br /> - null value -> `null`<br /><br />- `legacy` Behavior before version 0.56.0.<br /> - string value -> `string`<br /> - numeric value -> `number`<br /> - boolean value -> `boolean`<br /> - null value -> `NullType`<br /><br />**Default**<br />` legacy ` |
