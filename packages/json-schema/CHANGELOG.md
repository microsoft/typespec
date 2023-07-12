# Change Log - @typespec/json-schema

This log was last generated on Tue, 11 Jul 2023 22:06:00 GMT and should not be manually modified.

## 0.46.0
Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Add support for enum member references.
- Export the emitter and related types from the package.
- Fix a bug that could result in a schema being bundled more than once.
- By default, types that are not marked with @jsonSchema or are within a namespace with @jsonSchema are bundled into the schemas that reference them. Set the `emitAllRefs` option to true to get the previous behavior of emitting all types referenced as JSON Schema.
- Support @extension for adding arbitrary vendor extensions into the output.
- Breaking change: the namespace has been corrected to TypeSpec.JsonSchema.
- Fix: Make sure `$lib` is exported
- Add support for Record<T>
- Support templates instantiated with intrinsic types and type expressions.
- Update dependencies

## 0.45.0
Tue, 06 Jun 2023 22:44:16 GMT

### Minor changes

- Add @typespec/json-schema for defining and emitting TypeSpec to standard JSON Schema

