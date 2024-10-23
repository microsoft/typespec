---
jsApi: true
title: "[I] PackageFlags"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `decoratorArgMarshalling?` | `readonly` | `"new"` \| `"legacy"` | Decorator arg marshalling algorithm. Specify how TypeSpec values are marshalled to decorator arguments. - `new` - New recommended behavior - string value -> `string` - numeric value -> `number` if the constraint can be represented as a JS number, Numeric otherwise(e.g. for types int64, decimal128, numeric, etc.) - boolean value -> `boolean` - null value -> `null` - `legacy` - DEPRECATED - Behavior before version 0.56.0. - string value -> `string` - numeric value -> `number` - boolean value -> `boolean` - null value -> `NullType` **Default** `new` |
