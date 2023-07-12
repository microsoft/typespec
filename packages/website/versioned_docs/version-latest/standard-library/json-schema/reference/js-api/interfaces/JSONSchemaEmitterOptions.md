[JS Api](../index.md) / JSONSchemaEmitterOptions

# Interface: JSONSchemaEmitterOptions

## Table of contents

### Properties

- [bundleId](JSONSchemaEmitterOptions.md#bundleid)
- [emitAllModels](JSONSchemaEmitterOptions.md#emitallmodels)
- [emitAllRefs](JSONSchemaEmitterOptions.md#emitallrefs)
- [file-type](JSONSchemaEmitterOptions.md#file-type)
- [int64-strategy](JSONSchemaEmitterOptions.md#int64-strategy)

## Properties

### bundleId

• `Optional` **bundleId**: `string`

When provided, bundle all the schemas into a single json schema document
with schemas under $defs. The provided id is the id of the root document
and is also used for the file name.

___

### emitAllModels

• `Optional` **emitAllModels**: `boolean`

When true, emit all model declarations to JSON Schema without requiring
the

**`Json Schema`**

decorator.

___

### emitAllRefs

• `Optional` **emitAllRefs**: `boolean`

When true, emit all references as json schema files, even if the referenced
type does not have the `@jsonSchema` decorator or is not within a namespace
with the `@jsonSchema` decorator.

___

### file-type

• `Optional` **file-type**: `FileType`

Serialize the schema as either yaml or json.

**`Default`**

yaml, it not specified infer from the `output-file` extension

___

### int64-strategy

• `Optional` **int64-strategy**: `Int64Strategy`

How to handle 64 bit integers on the wire. Options are:

* string: serialize as a string (widely interoperable)
* number: serialize as a number (not widely interoperable)
