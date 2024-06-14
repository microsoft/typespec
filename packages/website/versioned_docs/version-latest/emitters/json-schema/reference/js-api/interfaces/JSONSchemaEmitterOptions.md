---
jsApi: true
title: "[I] JSONSchemaEmitterOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `bundleId?` | `string` | When provided, bundle all the schemas into a single json schema document with schemas under $defs. The provided id is the id of the root document and is also used for the file name. |
| `emitAllModels?` | `boolean` | <p>When true, emit all model declarations to JSON Schema without requiring the</p><p>**Json Schema**</p><p>decorator.</p> |
| `emitAllRefs?` | `boolean` | When true, emit all references as json schema files, even if the referenced type does not have the `@jsonSchema` decorator or is not within a namespace with the `@jsonSchema` decorator. |
| `file-type?` | `FileType` | <p>Serialize the schema as either yaml or json.</p><p>**Default**</p><p>yaml, it not specified infer from the `output-file` extension</p> |
| `int64-strategy?` | `Int64Strategy` | <p>How to handle 64 bit integers on the wire. Options are:</p><p>* string: serialize as a string (widely interoperable)</p><p>* number: serialize as a number (not widely interoperable)</p> |
