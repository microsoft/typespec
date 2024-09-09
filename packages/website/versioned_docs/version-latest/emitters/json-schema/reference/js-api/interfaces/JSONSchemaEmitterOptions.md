---
jsApi: true
title: "[I] JSONSchemaEmitterOptions"

---
## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| `bundleId?` | `string` | When provided, bundle all the schemas into a single json schema document with schemas under $defs. The provided id is the id of the root document and is also used for the file name. |
| `emitAllModels?` | `boolean` | When true, emit all model declarations to JSON Schema without requiring the **Json Schema** decorator. |
| `emitAllRefs?` | `boolean` | When true, emit all references as json schema files, even if the referenced type does not have the `@jsonSchema` decorator or is not within a namespace with the `@jsonSchema` decorator. |
| `file-type?` | `FileType` | Serialize the schema as either yaml or json. **Default** yaml, it not specified infer from the `output-file` extension |
| `int64-strategy?` | `Int64Strategy` | How to handle 64 bit integers on the wire. Options are: * string: serialize as a string (widely interoperable) * number: serialize as a number (not widely interoperable) |
