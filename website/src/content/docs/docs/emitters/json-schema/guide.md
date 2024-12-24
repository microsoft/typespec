---
title: Guide
---

When a TypeSpec data type has the `@jsonSchema` decorator or is declared inside a namespace with that decorator, it is considered a _JSON Schema type_.

By default, this emitter will produce one JSON Schema file per JSON Schema type. The file defines an `$id` metadata keyword based on the TypeSpec type name and the file format of the schema (for example, `Widget.yaml`). The `$id` can be overridden by using the `@id` decorator.

:::note
The base URI of a schema is the reference point for resolving relative URIs within the schema, such as those inside `$ref`s. When the `$id` metadata keyword of a schema is an absolute URI, the `$id` is the base URI. When the `$id` is a relative reference, then the base URI is determined by resolving the relative reference against the URI used to retrieve the schema.

The default behavior of this emitter for a model named `Widget` is to produce a schema with a `$id` of `Widget.yaml`, which allows the actual base URI of the document to differ depending on where it is retrieved from, and therefore should allow resolving relative references to other schemas whether loaded from disk or retrieved over HTTP.
:::

When JSON Schema types reference other JSON Schema types, those references are created using a `$ref` with a relative reference (see the note above for how this works in JSON Schema).

How this emitter handles data types which aren't JSON Schema types can be controlled using the `emitAllModels` and `emitAllRefs` options.

By default, this emitter does not define schemas for such data types. Instead, the schemas for them are placed in the `$defs` of any JSON Schema types that reference them. The schemas do not define either `$id` or `$schema` metadata keywords. The `$defs` are referenced using a `$ref` with URI fragment containing a JSON Pointer, which uses the syntax of the following form:

```json
{ "$ref": "#/$defs/{TypeNameHere}" }
```

If you want to treat all TypeSpec types as JSON Schema types (even if they don't have the `@jsonSchema` decorator), you can set the `emitAllModels` option to true. With this set, every data type in your TypeSpec program will get its own schema file, and all references will be relative URIs.

If you want to treat all TypeSpec types referenced from JSON Schema types as JSON Schema types (even if they don't have the `@jsonSchema` decorator), you can set the `emitAllRefs` option to true. With this set, data types which are referenced from JSON Schema types will get their own schema file, and all references to them will be relative URIs.

## Bundling behavior

By default, this emitter will produce separate schema files for each JSON Schema type in your program. However, if you prefer to bundle all of your schemas into a single file, you can set the `bundleId` option to the id you want to use for your bundle. You will now get a single file containing all of your schemas.

Note that bundling does not affect any references within the bundled schemas. In particular, references between JSON Schema types still use relative URIs. As such, correctly resolving these references to the local file requires JSON Schema implementations to support bundling as defined in the JSON Schema 2020-12 specification.

Note also that this does not affect the behavior of non-JSON Schema data types. In particular, by default, non-JSON Schema data types are inlined into each referencing schema's `$defs` object. The `emitAllModels` and `emitAllRefs` options can be used to turn these inlined `$defs` into `$defs` in the bundle.
